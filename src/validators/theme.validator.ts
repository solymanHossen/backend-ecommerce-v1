import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

const colorSchema = Joi.object({
  background: Joi.string().required(),
  foreground: Joi.string().required(),
  primary: Joi.string().required(),
  'primary-foreground': Joi.string().required(),
  secondary: Joi.string().required(),
  'secondary-foreground': Joi.string().required(),
  accent: Joi.string().required(),
  'accent-foreground': Joi.string().required(),
  muted: Joi.string().required(),
  'muted-foreground': Joi.string().required(),
  card: Joi.string().required(),
  'card-foreground': Joi.string().required(),
  border: Joi.string().required(),
  input: Joi.string().required(),
  ring: Joi.string().required(),
});

const createThemeSchema = Joi.object({
  name: Joi.string().alphanum().min(2).max(50).required(),
  label: Joi.string().min(2).max(100).required(),
  colors: Joi.object({
    light: colorSchema.required(),
    dark: colorSchema.required()
  }).required()
});

const updateThemeSchema = Joi.object({
  label: Joi.string().min(2).max(100),
  colors: Joi.object({
    light: colorSchema,
    dark: colorSchema
  })
});

const setActiveThemeSchema = Joi.object({
  theme: Joi.string().alphanum().min(2).max(50).required(),
  isDark: Joi.boolean().default(false)
});

const themeNameSchema = Joi.object({
  name: Joi.string().alphanum().min(2).max(50).required()
});

export const validateCreateTheme = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = createThemeSchema.validate(req.body);
  if (error) {
    logger.error(error);
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  next();
};

export const validateUpdateTheme = (req: Request, res: Response, next: NextFunction): void => {
  const bodyError = updateThemeSchema.validate(req.body).error;
  const paramError = themeNameSchema.validate(req.params).error;

  if (bodyError) {
    logger.error(bodyError);
    res.status(400).json({ error: bodyError.details[0].message });
    return;
  }

  if (paramError) {
    logger.error(paramError);
    res.status(400).json({ error: paramError.details[0].message });
    return;
  }

  next();
};

export const validateSetActiveTheme = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = setActiveThemeSchema.validate(req.body);
  if (error) {
    logger.error(error);
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  next();
};

export const validateThemeName = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = themeNameSchema.validate(req.params);
  if (error) {
    logger.error(error);
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  next();
};
