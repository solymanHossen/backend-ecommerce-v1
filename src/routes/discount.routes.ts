import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { createDiscount, getDiscounts, updateDiscount, deleteDiscount } from '../controllers/discount.controller';
import { validateCreateDiscount, validateUpdateDiscount } from '../validators/discount.validator';

const router = express.Router();

// SECURITY FIX: All discount management routes require admin access
router.post('/', authMiddleware, adminMiddleware, validateCreateDiscount, createDiscount);
router.get('/', getDiscounts); // Can be public for displaying active discounts
router.put('/:id', authMiddleware, adminMiddleware, validateUpdateDiscount, updateDiscount);
router.delete('/:id', authMiddleware, adminMiddleware, deleteDiscount);

export default router;