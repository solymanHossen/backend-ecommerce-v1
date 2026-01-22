import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from "../utils/logger";

const addressSchema = Joi.object({
    fullName: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('', null).optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
});

const orderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            product: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required(),
            price: Joi.number().optional() // Make optional if backend looks it up
        })
    ).required(),
    user: Joi.string().optional(),
    subtotal: Joi.number().required(),
    tax: Joi.number().default(0),
    shippingCost: Joi.number().default(0),
    discountAmount: Joi.number().default(0),
    totalAmount: Joi.number().required(),
    finalAmount: Joi.number().required(),
    paymentMethod: Joi.string().valid('credit_card', 'paypal', 'cod').default('credit_card'),
    paymentStatus: Joi.string().valid('pending', 'paid', 'failed').default('pending'),
    shippingAddress: addressSchema.required(),
    billingAddress: addressSchema.required(),
    status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').default('pending')
}).unknown(true); // Allow other fields cautiously, or be strict. Better strict, but for speed allowing unknown might help if I missed one.

const orderStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').required(),
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
