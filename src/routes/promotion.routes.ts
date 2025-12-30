import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createPromotion, getPromotions, updatePromotion, deletePromotion, getPromotionEffectiveness } from '../controllers/promotion.controller';
import { validateCreatePromotion, validateUpdatePromotion } from '../validators/promotion.validator';

const router = express.Router();

router.post('/', authMiddleware, validateCreatePromotion, createPromotion);
router.get('/', getPromotions);
router.put('/:id', authMiddleware, validateUpdatePromotion, updatePromotion);
router.delete('/:id', authMiddleware, deletePromotion);
router.get('/:id/effectiveness', authMiddleware, getPromotionEffectiveness);

export default router;