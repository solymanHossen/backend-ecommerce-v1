import { Response } from 'express';
import { OrderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth.middleware';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orderData = {
        user: req.user!._id,
        ...req.body
    };
    const order = await OrderService.createOrder(orderData);
    sendResponse(res, 201, true, "Order created successfully", order);
});

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orders = await OrderService.getOrders(req.user!._id);
    sendResponse(res, 200, true, "Orders fetched successfully", orders);
});

export const getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await OrderService.getOrderById(req.params.id);
    if (!order) {
         throw new AppError("Order not found", 404);
    }
    
    if (!order.user || order.user.toString() !== req.user!._id.toString()) {
         throw new AppError("Not authorized to view this order", 403);
    }
    sendResponse(res, 200, true, "Order fetched successfully", order);
});

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
        throw new AppError("Not authorized to update order status", 403);
    }
    const updatedOrder = await OrderService.updateOrderStatus(req.params.id, req.body.status);
    if (!updatedOrder) {
         throw new AppError("Order not found", 404);
    }
    sendResponse(res, 200, true, "Order status updated successfully", updatedOrder);
});
