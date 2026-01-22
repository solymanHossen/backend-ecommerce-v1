import Redis from 'ioredis';
import logger from '../utils/logger';

// Only initialize if REDIS_URL is provided or in dev? 
// The user asked to "Integrate Redis". 
// I'll assume a local redis or env var.

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    retryStrategy(times) {
        if (times > 3) {
            logger.warn('Redis connection failed too many times. Disabling cache temporarily.');
            return null; // Stop verifying
        }
        return Math.min(times * 50, 2000);
    },
});

redis.on('error', (err) => {
    logger.error('Redis Client Error', err);
});

redis.on('connect', () => {
    logger.info('Connected to Redis');
});

export default redis;
