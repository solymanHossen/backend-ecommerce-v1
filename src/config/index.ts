import dotenv from 'dotenv';
import { z } from 'zod';
import logger from '../utils/logger';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 chars"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET must be at least 10 chars"),
  EMAIL_USER: z.string().nonempty("EMAIL_USER is required"),
  EMAIL_PASS: z.string().nonempty("EMAIL_PASS is required"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  BASE_URL: z.string().url().optional().default('http://localhost:3000'),
  REDIS_URL: z.string().optional()
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  logger.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
