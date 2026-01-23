import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from "../utils/logger";

const productSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    htmlDescription: Joi.string().required(),
    price: Joi.number().positive().required(),
    category: Joi.array().items(Joi.string()).required(),
    imageUrl: Joi.string().uri().optional(),
    stock: Joi.number().positive().required(),
});

// Update Product Schema (allows partial data)
const updateProductSchema = Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    htmlDescription: Joi.string(),
    price: Joi.number().positive(),
    category: Joi.array().items(Joi.string()),
    imageUrl: Joi.string().uri(),
    stock: Joi.number().positive()
});

export const validateCreateProduct = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = productSchema.validate(req.body);
    if (error)  {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};

export const validateUpdateProduct = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = updateProductSchema.validate(req.body);
    if (error) {
        logger.error(error)
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};

const listProductSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().allow('').optional(),
    category: Joi.string().allow('').optional(),
    sort: Joi.string().optional(),
    // Allow other potential filters but ensure limit is safe
}).unknown(true);

export const validateListProducts = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = listProductSchema.validate(req.query);
    if (error) {
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};