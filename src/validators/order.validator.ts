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
            // price removed - server calculated
        })
    ).required(),
    user: Joi.string().optional(), // If admin creates for user? Or ignored if controller overwrites.
    paymentMethod: Joi.string().valid('credit_card', 'paypal', 'cod').default('credit_card'),
    shippingAddress: addressSchema.required(),
    billingAddress: addressSchema.required(),
    promotionCode: Joi.string().allow('', null).optional()
    // subtotal, tax, totalAmount, finalAmount, status, paymentStatus REMOVED. Sever controlled.
}); // No unknown(true) -> strict by default or implied. Joi defaults vary but usually strict object.

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
