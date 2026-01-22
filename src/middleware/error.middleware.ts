import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    
    // Log the error using our redacted logger
    logger.error({
        message: err.message, 
        stack: err.stack,
        url: req.originalUrl, 
        method: req.method,
        statusCode: err.statusCode
    });

    const response = {
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err })
    };

    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
        response.message = 'Something went very wrong!';
    }

    res.status(err.statusCode).json(response);
};
