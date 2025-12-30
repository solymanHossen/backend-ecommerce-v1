import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from "../utils/logger";

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
});
const verifyEmailSchema = Joi.object({
    otp: Joi.string().required().length(6).pattern(/^[0-9]+$/).message('OTP must be a 6-digit number'),
    email: Joi.string().email().required()
});
const resendOTPSchema = Joi.object({
    email: Joi.string().email().required()
});
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});
const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});
const resetPasswordSchema = Joi.object({
    token: Joi.string().required().length(64).hex(),
    password: Joi.string().required().min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    next();
};
export const verifyEmailValidator = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = verifyEmailSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    next();
};
export const resendOTPValidator = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = resendOTPSchema.validate(req.body);
    if (error) {
        logger.error(error);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    next();
};
export const forgotPasswordValidator = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = forgotPasswordSchema.validate(req.body);
    if (error) {
        logger.error('Forgot password validation failed:', error);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    next();
};

export const resetPasswordValidator = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = resetPasswordSchema.validate({ ...req.params, ...req.body });
    if (error) {
        logger.error('Reset password validation failed:', error);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    next();
};