import { Order, IOrder } from '../models/order.model';
import mongoose, {Schema} from "mongoose";
import { Product } from '../models/product.model';
import { PromotionService } from './promotion.service';
import { AppError } from "../utils/AppError";
import { GlobalSettingService } from './global-setting.service';

export class OrderService {
    static async createOrder(orderData: { 
        user: string | mongoose.Types.ObjectId; 
        items: { product: string; quantity: number }[]; 
        shippingAddress: any; 
        billingAddress: any; 
        paymentMethod: string;
        promotionCode?: string; // Optional code
        // Ignored fields from interface to prevent TS errors if passed by sloppy casting, 
        // but explicit args are better.
    }): Promise<IOrder> {
         const session = await mongoose.startSession();
         session.startTransaction();

         try {
            const { user, items, shippingAddress, billingAddress, paymentMethod, promotionCode } = orderData;
            
            // Fetch dynamic settings
            const settings = await GlobalSettingService.getSettings();
            const TAX_RATE = settings.taxRate;
            const SHIPPING_COST = settings.shippingCost;

            if (!items || items.length === 0) {
                throw new AppError("Cart is empty", 400);
            }

            let subtotal = 0;
            const validatedItems: any[] = [];

            for (const item of items) {
                const product = await Product.findById(item.product).session(session);
                if (!product) {
                    throw new AppError(`Product not found: ${item.product}`, 404);
                }
                if ((product.stock as number) < item.quantity) {
                     throw new AppError(`Insufficient stock for ${product.name}`, 400);
                }
                
                const price = product.price;
                subtotal += price * item.quantity;
                validatedItems.push({
                    product: product._id,
                    quantity: item.quantity,
                    price: price
                });
            }

            const tax = subtotal * TAX_RATE;
            let discountAmount = 0;
            let promotionId = undefined;

            if (promotionCode) {
                const promotion = await PromotionService.getPromotionByCode(promotionCode);
                // Basic validation (simplified vs CheckoutService)
                 if (promotion && promotion.isActive && new Date() >= promotion.startDate && new Date() <= promotion.endDate) {
                      if (promotion.usageCount < promotion.usageLimit) {
                            // Check min purchase
                            if (!promotion.minPurchaseAmount || (subtotal + tax + SHIPPING_COST) >= promotion.minPurchaseAmount) {
                                discountAmount = await PromotionService.applyPromotion(promotion, subtotal + tax + SHIPPING_COST);
                                promotionId = promotion._id;
                                await PromotionService.incrementUsageCount(promotion._id.toString());
                            }
                      }
                 }
            }

            const totalAmount = subtotal + tax + SHIPPING_COST;
            const finalAmount = Math.max(0, totalAmount - discountAmount);

            const order = new Order({
                user,
                items: validatedItems,
                subtotal,
                tax,
                shippingCost: SHIPPING_COST,
                totalAmount,
                discountAmount, 
                finalAmount,
                status: 'pending',
                paymentStatus: 'pending',
                paymentMethod,
                shippingAddress,
                billingAddress,
                promotion: promotionId
            });
            
            await order.save({ session });
            await session.commitTransaction();
            return order;
         } catch(err) {
             await session.abortTransaction();
             throw err;
         } finally {
             session.endSession();
         }
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