import { GlobalSetting, IGlobalSetting } from '../models/global-setting.model';
import redis from '../config/redis';
import logger from '../utils/logger';

const CACHE_KEY = 'global_settings';
const CACHE_TTL = 3600; // 1 hour

export class GlobalSettingService {
    /**
     * Get global settings with caching strategy.
     * 1. Check Redis cache
     * 2. If miss, fetch/create from DB (Singleton pattern)
     * 3. Cache the result
     */
    static async getSettings(): Promise<IGlobalSetting> {
        try {
            // 1. Try fetching from Redis
            const cachedSettings = await redis.get(CACHE_KEY);
            if (cachedSettings) {
                // Return parsed plain object, but we might need a Document if callers expect methods.
                // However, for config values, a plain object is usually fine.
                // To maintain typing consistency with Mongoose return, we might just return the object properties
                // or hydrate it if necessary. For performance, plain object is better.
                // But the return type says Promise<IGlobalSetting>.
                // Let's hydrate it or return the plain object casted if we don't need save().
                // Callers just need values.
                return JSON.parse(cachedSettings) as IGlobalSetting;
            }
        } catch (error) {
            logger.error('Redis cache error in getSettings:', error);
            // Fallthrough to DB on cache error
        }

        // 2. Fetch from DB (or create default)
        const settings = await GlobalSetting.getSingleton();

        // 3. Update Cache
        try {
            await redis.set(CACHE_KEY, JSON.stringify(settings), 'EX', CACHE_TTL);
        } catch (error) {
            logger.error('Failed to set settings cache:', error);
        }

        return settings;
    }

    /**
     * Update settings and invalidate cache.
     */
    static async updateSettings(data: Partial<IGlobalSetting>): Promise<IGlobalSetting> {
        const settings = await GlobalSetting.getSingleton();
        
        Object.assign(settings, data);
        const updatedSettings = await settings.save();

        // Invalidate/Refresh Cache
        try {
            // We can either delete or overwrite. Overwriting is faster for next read.
            await redis.set(CACHE_KEY, JSON.stringify(updatedSettings), 'EX', CACHE_TTL);
        } catch (error) {
            logger.error('Failed to update settings cache:', error);
            // If cache update fails, delete it to ensure next read fetches fresh data
            await redis.del(CACHE_KEY);
        }

        return updatedSettings;
    }
}
