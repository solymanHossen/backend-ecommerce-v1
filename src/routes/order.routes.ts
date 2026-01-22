import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { createOrder, getOrders, getOrder, updateOrderStatus } from '../controllers/order.controller';
import { validateCreateOrder, validateUpdateOrderStatus } from '../validators/order.validator';

const router = express.Router();

router.post('/', authMiddleware, validateCreateOrder, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrder);
// SECURITY FIX: Use admin middleware instead of inline check
router.patch('/:id/status', authMiddleware, adminMiddleware, validateUpdateOrderStatus, updateOrderStatus);

export default router;