import { Response } from 'express';
import { OrderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth.middleware';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { storeService } from '../services/store.service';

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

export const getVendorOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await storeService.getStoreByOwner(req.user!._id);
    const orders = await OrderService.getVendorOrders(store._id as string);
    sendResponse(res, 200, true, "Vendor orders fetched successfully", orders);
});

export const getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await OrderService.getOrderById(req.params.id);
    if (!order) {
         throw new AppError("Order not found", 404);
    }
    
    // Authorization: User owns it OR User is the Vendor for this order OR Admin
    // Using simple check:
    const isOwner = order.user && order.user.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    
    // Vendor check:
    let isVendor = false;
    if (req.user!.role === 'vendor') {
         try {
             const store = await storeService.getStoreByOwner(req.user!._id);
             if (order.store && order.store.toString() === store._id.toString()) {
                 isVendor = true;
             }
         } catch(e) {}
    }

    if (!isOwner && !isAdmin && !isVendor) {
         throw new AppError("Not authorized to view this order", 403);
    }
    
    sendResponse(res, 200, true, "Order fetched successfully", order);
});

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    // SECURITY FIX: Authorization
    const order = await OrderService.getOrderById(req.params.id);
    if (!order) throw new AppError("Order not found", 404);

    if (req.user!.role === 'vendor') {
         const store = await storeService.getStoreByOwner(req.user!._id);
         if (!order.store || order.store.toString() !== store._id.toString()) {
              throw new AppError("Not authorized to update this order", 403);
         }
    } else if (req.user!.role !== 'admin') {
         throw new AppError("Not authorized", 403);
    }

    const updatedOrder = await OrderService.updateOrderStatus(req.params.id, req.body.status);
    sendResponse(res, 200, true, "Order status updated successfully", updatedOrder);
});
