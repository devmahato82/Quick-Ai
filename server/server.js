import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import logger from './utils/logger.js';

const app =  express()

app.use(cors());
app.use(express.json());

// Apply structured request logging payload natively
app.use(pinoHttp({ logger }));

// Global Rate Limiter: Maximum 10 APIs per minute by IP footprint preventing spam bursts.
const limiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 10,
    message: { success: false, message: "Too many requests. Please try again later.", data: null },
    standardHeaders: true, 
    legacyHeaders: false,
});
app.use(limiter);

app.use(clerkMiddleware());

app.get('/', (req,res)=>res.send('Server is live! '))

app.use(requireAuth());

app.use('/api/ai', aiRouter)

// Global error handler must be the last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})