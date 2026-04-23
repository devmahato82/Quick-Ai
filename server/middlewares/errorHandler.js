import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    logger.error({ 
        err: err.message, 
        stack: err.stack, 
        path: req.path,
        method: req.method
    }, "Global Error Handler Caught Exception");
    
    const statusCode = err.status || 500;
    
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        data: null
    });
};
