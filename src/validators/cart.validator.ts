import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from "../utils/logger";

const addToCartSchema = Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
});

const updateCartItemSchema = Joi.object({
    quantity: Joi.number().integer().min(1).required(),
});

export const validateAddToCart = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = addToCartSchema.validate(req.body);
    if (error){
        logger.error(error);
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};

export const validateUpdateCartItem = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = updateCartItemSchema.validate(req.body);
    if (error) {
        logger.error(error);
         res.status(400).json({ error: error.details[0].message }); return ;
    }
    next();
};