import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from "../utils/logger";

const addressSchema = Joi.object({
    fullName: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
});

const createCheckoutSessionSchema = Joi.object({
    items: Joi.array(),
    totalAmount: Joi.number().positive().required(),
    subtotal: Joi.number().positive().required(),
    tax: Joi.number().min(0).required(),
    shippingCost: Joi.number().min(0).required(),
    discountAmount: Joi.number().min(0).default(0),
    finalAmount: Joi.number().positive().required(),
    status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').default('pending'),
    paymentStatus: Joi.string().valid('pending', 'paid', 'failed').default('pending'),
    paymentMethod: Joi.string().valid('credit_card', 'paypal', 'cash_on_delivery').required(),
    paymentIntentId: Joi.string().optional(),
    shippingAddress: addressSchema.required(),
    billingAddress: addressSchema.required(),
});

const confirmOrderSchema = Joi.object({
    sessionId: Joi.string().required(),
});

export const validateCreateCheckoutSession = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = createCheckoutSessionSchema.validate(req.body);
    if (error) {
        logger.error(error);
       res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};

export const validateConfirmOrder = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = confirmOrderSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};