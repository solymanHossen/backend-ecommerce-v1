import { Response } from 'express';
import { OrderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from "../utils/logger";
export const createOrder = async (req: AuthRequest, res: Response):Promise<void> => {

    try {
        const orderData = {
            user: req.user!._id,
            ...req.body
        };
        const order = await OrderService.createOrder(orderData);
        res.status(201).json(order);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Error creating order', error });
    }
};

export const getOrders = async (req: AuthRequest , res: Response) => {
    try {
        const orders = await OrderService.getOrders(req.user!._id);
        res.json(orders);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

export const getOrder = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const order = await OrderService.getOrderById(req.params.id);
        if (!order) {
             res.status(404).json({ message: 'Order not found' }); return ;
        }
        if (!order.user || order.user.toString()  !== req.user!._id.toString()) {
             res.status(403).json({ message: 'Not authorized to view this order' }); return
        }
        res.json(order);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Error fetching order', error });
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const updatedOrder = await OrderService.updateOrderStatus(req.params.id, req.body.status);
        if (!updatedOrder) {
             res.status(404).json({ message: 'Order not found' }); return ;
        }
        res.json(updatedOrder);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Error updating order status', error });
    }
};