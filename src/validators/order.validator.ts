import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from "../utils/logger";

const orderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            product: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required(),
        })
    ).required(),
    user: Joi.string(),
    subtotal: Joi.number(),
    totalPrice: Joi.number().positive(),
    totalAmount: Joi.number().positive(),
    status: Joi.string().valid(),
    finalAmount: Joi.number().positive(),
});

const orderStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered').required(),
});

export const validateCreateOrder = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = orderSchema.validate(req.body);
    if (error){
        logger.error(error);
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};

export const validateUpdateOrderStatus = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = orderStatusSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};