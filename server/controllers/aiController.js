import { clerkClient } from "@clerk/express";
import axios from "axios";
import FormData from "form-data";
import cloudinary from "../configs/cloudinary.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import sql from "../configs/db.js";
import { withRetry } from "../utils/apiResilience.js";
import { executeWithCacheAndDeduplication } from "../utils/cacheManager.js";
import { normalizeAIResponse } from "../utils/normalize.js";
import logger from "../utils/logger.js";

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const BLOG_TITLE_MODEL = process.env.GEMINI_BLOG_TITLE_MODEL || "gemini-2.5-flash";
const BLOG_TITLE_PROMPT_VERSION = "v2";

const fetchImageAsDataUrl = async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`IMAGE_FETCH_FAILED_${response.status}`);
    }

    const mimeType = response.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
};

const buildGeminiImageRequest = (prompt) => {
    const request = {
        model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
    };

    return request;
};

const buildOpenAIImageRequest = (prompt) => ({
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    output_format: "png"
});

const applyCloudinaryTransformation = (url, transformation) => {
    if (!url || typeof url !== "string") return "";
    if (!url.includes("/upload/")) return url;
    return url.replace("/upload/", `/upload/${transformation}/`);
};

const withProviderTimeout = (promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('PROVIDER_CHAIN_TIMEOUT')), ms))
]);

export const generateArticle = async(req, res, next) => {
    try{
        const {userId} = await req.auth();
        const {prompt, length }= req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: "Limit reached. Upgrade to continue.", data: null})
        }

        // Fix: Do not reference choices inside controller
        const performGeminiCall = async () => {
            return await AI.chat.completions.create({
                model: "gemini-3-flash-preview",
                messages: [{ role: "user", content: prompt || "" }],
                temperature: 0.7,
                max_tokens: length ? parseInt(length) : undefined,
            });
        };

        const fetchFunc = () => withRetry('gemini-article', performGeminiCall, [], 3);
        const rawContent = await executeWithCacheAndDeduplication('generateArticle', { prompt, length }, fetchFunc);
        const content = normalizeAIResponse(rawContent);

        if (!content) {
            return res.json({ success: false, message: "Failed to generate content", data: null });
        }

        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`

        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId,{
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            })
        }
        res.json({success: true, message: "Article generated successfully", data: content})

    } catch(error){
        next(error);
    }
}

export const getUserCreations = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
            ? Math.min(requestedLimit, 50)
            : 10;

        const creations = await sql`
            SELECT id, user_id, prompt, content, type, created_at, updated_at
            FROM creations
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT ${limit}
        `;

        const [{ count }] = await sql`
            SELECT COUNT(*)::int AS count
            FROM creations
            WHERE user_id = ${userId}
        `;

        res.json({
            success: true,
            message: "Creations fetched successfully",
            data: {
                creations,
                total: count || 0
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getPublishedCreations = async (req, res, next) => {
    try {
        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
            ? Math.min(requestedLimit, 50)
            : 20;

        const creations = await sql`
            SELECT
                id,
                user_id,
                prompt,
                content,
                type,
                publish,
                COALESCE(likes, ARRAY[]::text[]) AS likes,
                created_at,
                updated_at
            FROM creations
            WHERE publish = true AND type = 'image'
            ORDER BY created_at DESC
            LIMIT ${limit}
        `;

        res.json({
            success: true,
            message: "Published creations fetched successfully",
            data: creations
        });
    } catch (error) {
        next(error);
    }
}

export const toggleCreationLike = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        const creationId = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(creationId) || creationId <= 0) {
            return res.json({ success: false, message: "Invalid creation id", data: null });
        }

        const [creation] = await sql`
            SELECT id, COALESCE(likes, ARRAY[]::text[]) AS likes
            FROM creations
            WHERE id = ${creationId} AND publish = true
            LIMIT 1
        `;

        if (!creation) {
            return res.json({ success: false, message: "Creation not found", data: null });
        }

        const hasLiked = creation.likes.includes(userId);

        const [updatedCreation] = hasLiked
            ? await sql`
                UPDATE creations
                SET likes = array_remove(COALESCE(likes, ARRAY[]::text[]), ${userId}), updated_at = NOW()
                WHERE id = ${creationId}
                RETURNING id, COALESCE(likes, ARRAY[]::text[]) AS likes
            `
            : await sql`
                UPDATE creations
                SET likes = array_append(COALESCE(likes, ARRAY[]::text[]), ${userId}), updated_at = NOW()
                WHERE id = ${creationId}
                RETURNING id, COALESCE(likes, ARRAY[]::text[]) AS likes
            `;

        res.json({
            success: true,
            message: hasLiked ? "Like removed" : "Creation liked",
            data: {
                id: updatedCreation.id,
                likes: updatedCreation.likes,
                liked: !hasLiked
            }
        });
    } catch (error) {
        next(error);
    }
}

export const generateBlogTitle = async(req, res, next) => {
    try{
        const {userId} = await req.auth();
        const {prompt }= req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: "Limit reached. Upgrade to continue.", data: null})
        }

        const AI_PROMPT = `You are an expert SEO copywriter and professional blogger.
Generate exactly 8 catchy, SEO-friendly blog post titles for this topic:
"${prompt}"

Rules:
- Return exactly 8 titles.
- Each title must be under 60 characters.
- Make them clear, natural, and click-worthy.
- Do not add introductions, explanations, headings, or filler text.
- Output only a numbered list.

Example format:
1. First title
2. Second title
3. Third title`;

        const performGeminiTitle = async () => {
            return await AI.chat.completions.create({
                model: BLOG_TITLE_MODEL,
                messages: [{ role: "user", content: AI_PROMPT }],
                temperature: 0.8,
                max_tokens: 1000,
            });
        };

        const fetchFunc = () => withRetry('gemini-blog-title', performGeminiTitle, [], 3);
        const rawContent = await executeWithCacheAndDeduplication(
            'generateBlogTitle',
            { prompt, model: BLOG_TITLE_MODEL, version: BLOG_TITLE_PROMPT_VERSION },
            fetchFunc
        );
        const content = normalizeAIResponse(rawContent);

        if (!content) {
            return res.json({ success: false, message: "Failed to generate content", data: null });
        }

        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`

        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId,{
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            })
        }
        res.json({success: true, message: "Blog titles generated successfully", data: content})

    } catch(error){
        next(error);
    }
}

export const generateImage = async(req, res, next) => {
    try{
        const {userId} = await req.auth();
        const {prompt, style, publish }= req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: "This feature is only available for premium subscription. ", data: null})
        }

        const sanitizedPrompt = prompt?.trim();
        if (!sanitizedPrompt) {
            return res.json({ success: false, message: "Prompt is required", data: null });
        }

        const finalPrompt = style ? `${sanitizedPrompt}. Render in ${style} style.` : sanitizedPrompt;

        const fetchFunc = async () => {
            try {
                logger.info({ provider: 'gemini', intention: 'generateImage' }, 'Attempting Gemini');
                const performGemini = async () => {
                    return await AI.images.generate(buildGeminiImageRequest(finalPrompt));
                };
                const response = await withProviderTimeout(withRetry('gemini-image', performGemini, [], 3), 15000);
                logger.info({ provider: 'gemini', status: 'success' });
                return response;
            } catch (geminiError) {
                logger.warn({ provider: 'gemini', status: 'failed', reason: geminiError.message });
                try {
                    logger.info({ provider: 'openai', intention: 'generateImage' }, 'Attempting OpenAI Fallback');
                    const performOpenAI = async () => {
                        return await openai.images.generate(buildOpenAIImageRequest(finalPrompt));
                    };
                    const response = await withProviderTimeout(withRetry('openai-image', performOpenAI, [], 3), 15000);
                    logger.info({ provider: 'openai', status: 'success' });
                    return response;
                } catch (openaiError) {
                    logger.warn({ provider: 'openai', status: 'failed', reason: openaiError.message });
                    logger.info({ provider: 'pollinations', intention: 'generateImage' }, 'Using Pollinations Fallback URL Proxy');
                    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;

                    try {
                        return await fetchImageAsDataUrl(pollinationsUrl);
                    } catch (pollinationsError) {
                        logger.warn({ provider: 'pollinations', status: 'failed', reason: pollinationsError.message });
                        return pollinationsUrl;
                    }
                }
            }
        };

        const rawContent = await executeWithCacheAndDeduplication('generateImage', { prompt: finalPrompt }, fetchFunc);
        const content = normalizeAIResponse(rawContent);

        if (!content) {
            return res.json({ success: false, message: "Failed to generate content", data: null });
        }

        await sql`
            INSERT INTO creations (user_id, prompt, content, type, publish)
            VALUES (${userId}, ${prompt}, ${content}, 'image', ${Boolean(publish)})
        `

        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId,{
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            })
        }
        res.json({success: true, message: "Image generated successfully", data: content})

    } catch(error){
        next(error);
    }
}

export const removeBackground = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: "Limit reached. Upgrade to continue.", data: null });
        }

        if (!req.file) {
            return res.json({ success: false, message: "No image provided", data: null });
        }

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const fetchFunc = async () => {
            const performCloudinary = async () => {
                return await cloudinary.uploader.upload(dataURI, { folder: "quickai_bg_removal" });
            };
            return await withRetry('cloudinary-bg-remove', performCloudinary, [], 3);
        };

        const rawContent = await executeWithCacheAndDeduplication('removeBackground', { image: req.file.buffer }, fetchFunc);
        let content = normalizeAIResponse(rawContent);
        
        if (content) {
           content = applyCloudinaryTransformation(content, 'e_background_removal/f_png');
        }

        if (!content) {
            return res.json({ success: false, message: "Failed to generate content", data: null });
        }

        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Background Removal', ${content}, 'remove-bg')`;

        if (plan !== 'premium') {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            });
        }

        res.json({ success: true, message: "Background removed successfully", data: content });

    } catch (error) {
        next(error);
    }
};

export const removeObject = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        const { prompt } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: "Limit reached. Upgrade to continue.", data: null });
        }

        if (!req.file) {
            return res.json({ success: false, message: "No image provided", data: null });
        }
        
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        const fetchFunc = async () => {
            const performCloudinary = async () => {
                return await cloudinary.uploader.upload(dataURI, { folder: "quickai_object_removal" });
            };
            return await withRetry('cloudinary-obj-remove', performCloudinary, [], 3);
        };

        const rawContent = await executeWithCacheAndDeduplication('removeObject', { image: req.file.buffer, prompt }, fetchFunc);
        let content = normalizeAIResponse(rawContent);
        
        if (content) {
            content = applyCloudinaryTransformation(
                content,
                `e_gen_remove:prompt_${encodeURIComponent(prompt || '')}`
            );
        }

        if (!content) {
            return res.json({ success: false, message: "Failed to generate content", data: null });
        }

        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'remove-obj')`;

        if (plan !== 'premium') {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            });
        }

        res.json({ success: true, message: "Object removed successfully", data: content });

    } catch (error) {
        next(error);
    }
};

export const reviewResume = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: "Limit reached. Upgrade to continue.", data: null });
        }

        if (!req.file) {
            return res.json({ success: false, message: "No resume PDF provided", data: null });
        }

        const pdfData = await pdfParse(req.file.buffer);
        const resumeText = pdfData.text;

        if (!resumeText || resumeText.length < 20) {
            return res.json({ 
                success: false, 
                message: "PDF contains no readable text.", 
                data: null 
            });
        }

        const AI_PROMPT = `Please review this resume and provide feedback. Give a short summary, list strengths, list weaknesses, and suggest improvements. Resume Content:\\n\\n${resumeText}`;

        const fetchFunc = async () => {
            const performGeminiResume = async () => {
                return await AI.chat.completions.create({
                    model: "gemini-3-flash-preview",
                    messages: [{ role: "user", content: AI_PROMPT }],
                    temperature: 0.7,
                    max_tokens: 1000,
                });
            };
            return await withRetry('gemini-resume', performGeminiResume, [], 3);
        };

        const rawContent = await executeWithCacheAndDeduplication('reviewResume', { text: resumeText }, fetchFunc);
        const content = normalizeAIResponse(rawContent);

        if (!content) {
            return res.json({ success: false, message: "Failed to generate content", data: null });
        }

        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Resume Review', ${content}, 'resume')`;

        if (plan !== 'premium') {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            });
        }

        res.json({ success: true, message: "Resume reviewed successfully", data: content });

    } catch (error) {
        next(error);
    }
};
