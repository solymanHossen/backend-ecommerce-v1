import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 requests per window
    standardHeaders: 'draft-7', 
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many authentication attempts, please try again later."
    }
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
     message: {
        status: 429,
        message: "Too many requests, please try again later."
    }
});
