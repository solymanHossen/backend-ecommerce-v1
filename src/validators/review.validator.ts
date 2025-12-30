import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from "../utils/logger";

const reviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(100).required(),
    comment: Joi.string().max(1000).required(),
});
const updateReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    title: Joi.string().max(100),
    comment: Joi.string().max(1000)
});

export const validateCreateReview = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = reviewSchema.validate(req.body);
    if (error){
        logger.error(error);
        res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};

export const validateUpdateReview = (req: Request, res: Response, next: NextFunction):void => {
    const { error } = updateReviewSchema.validate(req.body);
    if (error){
        logger.error(error);
      res.status(400).json({ error: error.details[0].message }); return;
    }
    next();
};