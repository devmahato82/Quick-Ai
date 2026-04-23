import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import aiRouter from './routes/aiRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import logger from './utils/logger.js';

const app = express();
const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://quick-ai-rose-three.vercel.app',
];

const allowedOrigins = new Set(
    (process.env.CORS_ALLOWED_ORIGINS || defaultAllowedOrigins.join(','))
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Not allowed by CORS'));
    }
}));
app.use(express.json());

// Apply structured request logging payload natively
app.use(pinoHttp({ logger }));

// Global Rate Limiter: Maximum 20 APIs per minute for load testing loop exclusively
const limiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 20, // Set to 20 temporarily so the 15 req load test can stress the AI engines instead of blocking at gateway
    message: { success: false, message: "Too many requests. Please try again later.", data: null },
    standardHeaders: true, 
    legacyHeaders: false,
});
app.use(limiter);

// Mock requireAuth and clerkMiddleware equivalents for TEST_MODE
app.use((req, res, next) => {
    if (process.env.TEST_MODE === 'true') {
        req.plan = 'premium';
        req.free_usage = 0;
        req.auth = async () => ({ userId: 'test_user_id', has: async () => true });
    }
    next();
});

app.use('/api/ai', aiRouter);
app.use(errorHandler);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
