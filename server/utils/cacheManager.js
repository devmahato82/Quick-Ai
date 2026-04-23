import crypto from 'crypto';
import logger from './logger.js';
import { normalizeAIResponse } from './normalize.js';

const cache = new Map();
const inProgress = new Map();

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 500;

// TTL cleanup every 60s
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now >= value.expiry) {
            cache.delete(key);
        }
    }
}, 60000).unref(); // unref so it doesn't block process exit

const normalizeInput = (input) => {
    if (typeof input === 'string') return input.trim().toLowerCase();
    if (typeof input === 'object' && input !== null) {
        if (Buffer.isBuffer(input)) return input.toString('base64').slice(0, 100); // Partial hash for buffer
        const normalized = {};
        for (const [key, value] of Object.entries(input)) {
            normalized[key] = normalizeInput(value);
        }
        return normalized;
    }
    return input;
};

export const generateHash = (input) => {
    const normalized = normalizeInput(input);
    return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
};

export const executeWithCacheAndDeduplication = async (actionName, input, fetchFunc) => {
    const hashKey = generateHash({ actionName, input });

    if (cache.has(hashKey)) {
        const { result, expiry } = cache.get(hashKey);
        if (Date.now() < expiry) {
            logger.info({ cache: 'hit', actionName, hashKey }, 'Returning cached response');
            global.cacheHits = (global.cacheHits || 0) + 1;
            return result;
        } else {
            cache.delete(hashKey);
        }
    }

    if (inProgress.has(hashKey)) {
        logger.info({ deduplication: 'hit', actionName, hashKey }, 'Waiting for existing identical request to complete');
        global.cacheHits = (global.cacheHits || 0) + 1;
        return await inProgress.get(hashKey);
    }

    logger.info({ cache: 'miss', actionName, hashKey }, 'Executing fresh request');
    
    const executePromise = (async () => {
        try {
            const rawResult = await fetchFunc();
            const result = normalizeAIResponse(rawResult);
            
            // Cache successful result strings only
            if (cache.size >= MAX_CACHE_SIZE) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            cache.set(hashKey, { result, expiry: Date.now() + CACHE_TTL });
            return result;
        } finally {
            inProgress.delete(hashKey); // Always clear after execution
        }
    })();

    inProgress.set(hashKey, executePromise);
    return await executePromise;
};
