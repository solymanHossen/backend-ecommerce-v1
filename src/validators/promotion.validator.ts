import { Request, Response, NextFunction } from 'express';
import Joi from  'joi';
import logger from "../utils/logger";

const promotionSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().valid('percentage', 'fixed').required(),
    value: Joi.number().positive().required(),
    code: Joi.string().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    isActive: Joi.boolean(),
    usageLimit: Joi.number().integer().min(1).required(),
    usageCount: Joi.number().integer(),
    minPurchaseAmount: Joi.number().min(0),
    applicableProducts: Joi.array().items(Joi.string()),
    applicableCategories: Joi.array().items(Joi.string()),
});
const updatePromotionSchema = Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    type: Joi.string().valid('percentage', 'fixed'),
    value: Joi.number().positive(),
    code: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().when('startDate', {
        is: Joi.exist(),
        then: Joi.date().min(Joi.ref('startDate')),
        otherwise: Joi.date()
    }),
    isActive: Joi.boolean(),
    usageLimit: Joi.number().integer().min(1),
    usageCount: Joi.number().integer(),
    minPurchaseAmount: Joi.number().min(0),
    applicableProducts: Joi.array().items(Joi.string()),
    applicableCategories: Joi.array().items(Joi.string())
});

export const validateCreatePromotion = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = promotionSchema.validate(req.body);
    if (error){
        logger.error(error);
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};

export const validateUpdatePromotion = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = updatePromotionSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};