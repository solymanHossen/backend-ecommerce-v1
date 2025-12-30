import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createOrder, getOrders, getOrder, updateOrderStatus } from '../controllers/order.controller';
import { validateCreateOrder, validateUpdateOrderStatus } from '../validators/order.validator';

const router = express.Router();

router.post('/', authMiddleware, validateCreateOrder, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrder);
router.patch('/:id/status', authMiddleware, validateUpdateOrderStatus, updateOrderStatus);

export default router;