import pLimit from 'p-limit';
import logger from './logger.js';
import axios from 'axios';
import axiosRetry from 'axios-retry';

// Apply axios-retry globally
axios.defaults.timeout = 10000; // 10s default timeout
axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
        const delays = [2000, 4000, 6000];
        return delays[retryCount - 1] || 6000;
    },
    retryCondition: (error) => {
        const isRateLimit = error.response?.status === 429;
        const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'));
        return isRateLimit || isTimeout || axiosRetry.isNetworkOrIdempotentRequestError(error);
    },
    onRetry: (retryCount, error, requestConfig) => {
        logger.warn({
            apiCallName: requestConfig.url,
            attempt: retryCount,
            reason: error.response?.status === 429 ? 'Rate Limit' : 'Timeout',
        }, `Axios Retrying API Call`);
    }
});

// Max 5 concurrent external API requests globally to prevent overloading quotas
export const concurrencyLimit = pLimit(5);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async (apiCallName, apiCallObj, args, maxRetries = 3) => {
    // Delays for exponential backoff: 2s, 4s, 6s
    const delays = [2000, 4000, 6000];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Apply 10s maximum timeout to the raw API call
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 10000)
            );
            
            // Execute bounded by concurrency queue
            return await concurrencyLimit(() => 
                Promise.race([apiCallObj(...args), timeoutPromise])
            );

        } catch (error) {
            // Determine if error is 429
            const isRateLimit = error.status === 429 || error.response?.status === 429 || (error.message && error.message.includes('429'));
            const isTimeout = error.message === 'REQUEST_TIMEOUT' || error.code === 'ECONNABORTED';
            const isBadRequest = error.status === 400 || error.response?.status === 400 || (error.message && error.message.includes('400'));

            if (isBadRequest || attempt === maxRetries || (!isRateLimit && !isTimeout)) {
                // If max retries reached or not a retryable error, throw it so the controller formats the response.
                if (isRateLimit && attempt === maxRetries) {
                    throw new Error("AI service is busy. Please try again shortly.");
                }
                throw error;
            }

            // Valid Retry condition
            const backoff = delays[attempt] || 6000;
            logger.warn({ 
                apiCallName, 
                attempt: attempt + 1, 
                reason: isTimeout ? 'Timeout' : 'Rate Limit', 
                backoff 
            }, `Retrying API Call`);
            
            await sleep(backoff);
        }
    }
};
