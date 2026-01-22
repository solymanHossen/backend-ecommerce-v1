import { Request, Response } from 'express';
import { CheckoutService } from '../services/checkout.service';
import { AuthRequest } from '../middleware/auth.middleware';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export const createCheckoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingAddress, billingAddress, promotionCode } = req.body;
    const { sessionId, orderId } = await CheckoutService.createCheckoutSession(req.user!._id, shippingAddress, billingAddress, promotionCode);
    sendResponse(res, 200, true, "Checkout session created", { sessionId, orderId });
});

export const confirmOrder = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const order = await CheckoutService.confirmOrder(sessionId);
    sendResponse(res, 200, true, "Order confirmed", order);
});

export const getOrderSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;
    const order = await CheckoutService.getOrderSummary(orderId);
    sendResponse(res, 200, true, "Order summary fetched", order);
});
