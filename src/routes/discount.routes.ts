import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createDiscount, getDiscounts, updateDiscount, deleteDiscount } from '../controllers/discount.controller';
import { validateCreateDiscount, validateUpdateDiscount } from '../validators/discount.validator';

const router = express.Router();

router.post('/', authMiddleware, validateCreateDiscount, createDiscount);
router.get('/', getDiscounts);
router.put('/:id', authMiddleware, validateUpdateDiscount, updateDiscount);
router.delete('/:id', authMiddleware, deleteDiscount);

export default router;