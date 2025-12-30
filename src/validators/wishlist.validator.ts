import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const addToWishlistSchema = Joi.object({
    productId: Joi.string().required(),
});

export const validateAddToWishlist = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = addToWishlistSchema.validate(req.body);
    if (error) {
       res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};