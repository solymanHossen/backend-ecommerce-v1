import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createCheckoutSession,confirmOrder,getOrderSummary} from '../controllers/checkout.controller';
import { validateCreateCheckoutSession, validateConfirmOrder } from '../validators/checkout.validator';

const router = express.Router();

router.post('/create-checkout-session', authMiddleware, validateCreateCheckoutSession, createCheckoutSession);
router.post('/confirm-order', validateConfirmOrder, confirmOrder);
router.get('/order-summary/:orderId', authMiddleware, getOrderSummary);

export default router;