import { Router } from 'express';
import { GlobalSettingController } from '../controllers/global-setting.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', GlobalSettingController.getSettings);

// Protected: Only Admins can update settings
router.put('/', authMiddleware, adminMiddleware, GlobalSettingController.updateSettings);

export default router;
