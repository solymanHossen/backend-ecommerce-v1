import { Order, IOrder } from '../models/order.model';
import mongoose, {Schema} from "mongoose";

export class OrderService {
    static async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
        const order = new Order(orderData);
        return order.save();
    }

    static async getOrders(userId:string | mongoose.Types.ObjectId): Promise<IOrder[]> {
        return Order.find({ user: userId }).populate('items.product');
    }

    static async getOrderById(id: string): Promise<IOrder | null> {
        return Order.findById(id).populate('items.product');
    }

    static async updateOrderStatus(id: string, status: string): Promise<IOrder | null> {
        return Order.findByIdAndUpdate(id, { status }, { new: true });
    }
}