import express from 'express';
import { authMiddleware, vendorMiddleware } from '../middleware/auth.middleware';
import { validateCreateStore, validateUpdateStore } from '../validators/store.validator';
import { registerStore, getMyStore, updateStore, getStoreBySlug } from '../controllers/store.controller';

const router = express.Router();

// Protected routes
router.post('/', authMiddleware, validateCreateStore, registerStore);
router.get('/me', authMiddleware, vendorMiddleware, getMyStore);
router.put('/me', authMiddleware, vendorMiddleware, validateUpdateStore, updateStore);

// Public routes
router.get('/:slug', getStoreBySlug);

export default router;
