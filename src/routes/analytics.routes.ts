import express from 'express';
import { authMiddleware, vendorMiddleware } from '../middleware/auth.middleware';
import { getVendorAnalytics } from '../controllers/analytics.controller';

const router = express.Router();

router.get('/vendor', authMiddleware, vendorMiddleware, getVendorAnalytics);

export default router;
