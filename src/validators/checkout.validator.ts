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
    shippingAddress: addressSchema.required(),
    billingAddress: addressSchema.required(),
    promotionCode: Joi.string().optional().allow(''),
    // Items are taken from Cart, not body for checkout session usually? 
    // Controller implementation: const { shippingAddress, billingAddress, promotionCode } = req.body;
    // So items are NOT expected in body.
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