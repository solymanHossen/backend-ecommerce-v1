import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from "../utils/logger";

const createStoreSchema = Joi.object({
    name: Joi.string().required().trim().min(3).max(50),
    description: Joi.string().optional().allow(''),
    logo: Joi.string().uri().optional().allow(''),
});

const updateStoreSchema = Joi.object({
    name: Joi.string().trim().min(3).max(50),
    description: Joi.string().allow(''),
    logo: Joi.string().uri().allow(''),
});

export const validateCreateStore = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = createStoreSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    next();
};

export const validateUpdateStore = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = updateStoreSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    next();
};
