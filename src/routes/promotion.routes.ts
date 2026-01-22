import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { createPromotion, getPromotions, updatePromotion, deletePromotion, getPromotionEffectiveness } from '../controllers/promotion.controller';
import { validateCreatePromotion, validateUpdatePromotion } from '../validators/promotion.validator';

const router = express.Router();

// SECURITY FIX: All promotion routes require admin access
router.post('/', authMiddleware, adminMiddleware, validateCreatePromotion, createPromotion);
router.get('/', getPromotions); // Can be public for displaying active promotions
router.put('/:id', authMiddleware, adminMiddleware, validateUpdatePromotion, updatePromotion);
router.delete('/:id', authMiddleware, adminMiddleware, deletePromotion);
router.get('/:id/effectiveness', authMiddleware, adminMiddleware, getPromotionEffectiveness);

export default router;