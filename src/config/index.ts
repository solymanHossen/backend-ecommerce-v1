import dotenv from 'dotenv';
import Joi from 'joi';
import logger from '../utils/logger';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.string().default('3000'),
  MONGODB_URI: Joi.string().required().description('Database Connection URI'),
  JWT_SECRET: Joi.string().min(10).required(),
  JWT_REFRESH_SECRET: Joi.string().min(10).required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASS: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),
  BASE_URL: Joi.string().uri().default('http://localhost:3000'),
  REDIS_URL: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required()
})
.unknown(); // Allow other environment variables to exist

const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false // Return all errors
});

if (error) {
  logger.error("❌ Invalid environment variables:", error.details.map((d) => d.message).join(', '));
  process.exit(1);
}

export const env = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  MONGODB_URI: envVars.MONGODB_URI,
  JWT_SECRET: envVars.JWT_SECRET,
  JWT_REFRESH_SECRET: envVars.JWT_REFRESH_SECRET,
  EMAIL_USER: envVars.EMAIL_USER,
  EMAIL_PASS: envVars.EMAIL_PASS,
  FRONTEND_URL: envVars.FRONTEND_URL,
  BASE_URL: envVars.BASE_URL,
  REDIS_URL: envVars.REDIS_URL,
  STRIPE_WEBHOOK_SECRET: envVars.STRIPE_WEBHOOK_SECRET
};

