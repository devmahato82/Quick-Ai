const asDataUrl = (base64, mimeType = "image/png") => {
    if (!base64) return "";
    return `data:${mimeType};base64,${base64}`;
};

const extractImagePayload = (payload) => {
    if (!payload) return "";
    if (typeof payload === "string") return payload;

    if (payload.url) return payload.url;
    if (payload.image_url) return payload.image_url;

    if (payload.b64_json) {
        return asDataUrl(payload.b64_json, payload.mime_type || payload.mimeType || "image/png");
    }

    if (payload.base64) {
        return asDataUrl(payload.base64, payload.mime_type || payload.mimeType || "image/png");
    }

    return "";
};

export const normalizeAIResponse = (raw) => {
    if (!raw) return "";

    // If it's already a string (cache hit, text output, or fallback URL)
    if (typeof raw === "string") return raw;

    // OpenAI / Gemini text response format
    if (raw.choices && Array.isArray(raw.choices) && raw.choices.length > 0) {
        return raw.choices[0]?.message?.content || raw.choices[0]?.text || "";
    }

    // Image APIs commonly return either a URL or base64 payload inside data[]
    if (raw.data && Array.isArray(raw.data) && raw.data.length > 0) {
        const image = raw.data.map(extractImagePayload).find(Boolean);
        if (image) return image;
    }

    // Responses-style image payloads may be nested in output/content arrays
    if (Array.isArray(raw.output) && raw.output.length > 0) {
        for (const item of raw.output) {
            const directImage = extractImagePayload(item);
            if (directImage) return directImage;

            if (Array.isArray(item?.content)) {
                const nestedImage = item.content.map(extractImagePayload).find(Boolean);
                if (nestedImage) return nestedImage;
            }
        }
    }

    if (raw.secure_url) {
        return raw.secure_url;
    }

    return extractImagePayload(raw);
};
