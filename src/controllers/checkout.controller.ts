import { Request, Response } from 'express';
import { CheckoutService } from '../services/checkout.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from "../utils/logger";

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
    try {
        const { shippingAddress, billingAddress, promotionCode } = req.body;
        const { sessionId, orderId } = await CheckoutService.createCheckoutSession(req.user!._id, shippingAddress, billingAddress, promotionCode);
        res.json({ sessionId, orderId });
    } catch (error) {
        logger.error('createCheckoutSession', error);
        res.status(400).json(error);
    }
};

export const confirmOrder = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        const order = await CheckoutService.confirmOrder(sessionId);
        res.json(order);
    } catch (error) {
        logger.error('confirmOrder', error);
        res.status(400).json(error);
    }
};

export const getOrderSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await CheckoutService.getOrderSummary(orderId);
        res.json(order);
    } catch (error) {
        logger.error(error);
        res.status(400).json(error);
    }
};
