import express from 'express';
import { authMiddleware, adminMiddleware, vendorMiddleware } from '../middleware/auth.middleware';
import { createOrder, getOrders, getVendorOrders, getOrder, updateOrderStatus } from '../controllers/order.controller';
import { validateCreateOrder, validateUpdateOrderStatus } from '../validators/order.validator';

const router = express.Router();

router.post('/', authMiddleware, validateCreateOrder, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/vendor/my-orders', authMiddleware, vendorMiddleware, getVendorOrders);
router.get('/:id', authMiddleware, getOrder);
// Allow vendors to update status too (controller handles specific permission)
router.patch('/:id/status', authMiddleware, validateUpdateOrderStatus, updateOrderStatus);

export default router;