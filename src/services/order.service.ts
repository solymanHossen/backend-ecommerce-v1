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

            // 1. Group items by Store and Validate
            const storeGroups: { [key: string]: any[] } = {};
            const allValidatedItems: any[] = [];
            let globalSubtotal = 0;

            for (const item of items) {
                const product = await Product.findById(item.product).session(session);
                if (!product) {
                    throw new AppError(`Product not found: ${item.product}`, 404);
                }
                if ((product.stock as number) < item.quantity) {
                     throw new AppError(`Insufficient stock for ${product.name}`, 400);
                }
                
                const price = product.price;
                const totalItemPrice = price * item.quantity;
                globalSubtotal += totalItemPrice;
                
                const validatedItem = {
                    product: product._id,
                    quantity: item.quantity,
                    price: price
                };
                allValidatedItems.push(validatedItem);

                const storeId = product.store ? product.store.toString() : 'admin'; // Fallback if no store
                if (!storeGroups[storeId]) {
                    storeGroups[storeId] = [];
                }
                storeGroups[storeId].push(validatedItem);
            }

            // 2. Calculate Global Totals and Promotion
            const globalTax = globalSubtotal * TAX_RATE;
            // Shipping: Charge once per store/shipment
            const storeIds = Object.keys(storeGroups);
            const globalShippingCost = SHIPPING_COST * storeIds.length;
            
            let globalDiscountAmount = 0;
            let promotionId = undefined;

            if (promotionCode) {
                const promotion = await PromotionService.getPromotionByCode(promotionCode);
                 if (promotion && promotion.isActive && new Date() >= promotion.startDate && new Date() <= promotion.endDate) {
                      if (promotion.usageCount < promotion.usageLimit) {
                            const qualifyAmount = globalSubtotal + globalTax + globalShippingCost;
                            if (!promotion.minPurchaseAmount || qualifyAmount >= promotion.minPurchaseAmount) {
                                globalDiscountAmount = await PromotionService.applyPromotion(promotion, qualifyAmount);
                                promotionId = promotion._id;
                                await PromotionService.incrementUsageCount(promotion._id.toString());
                            }
                      }
                 }
            }

            const globalTotalAmount = globalSubtotal + globalTax + globalShippingCost;
            const globalFinalAmount = Math.max(0, globalTotalAmount - globalDiscountAmount);

            // 3. Create Parent Order
            const parentOrder = new Order({
                user,
                items: allValidatedItems,
                subtotal: globalSubtotal,
                tax: globalTax,
                shippingCost: globalShippingCost,
                totalAmount: globalTotalAmount,
                discountAmount: globalDiscountAmount,
                finalAmount: globalFinalAmount,
                status: 'pending',
                paymentStatus: 'pending',
                paymentMethod,
                shippingAddress,
                billingAddress,
                promotion: promotionId,
                children: [] // Will populate later
            });
            await parentOrder.save({ session });

            // 4. Create Child Orders (Sub-orders per Store)
            const childOrderIds: any[] = [];

            for (const storeId of storeIds) {
                const storeItems = storeGroups[storeId];
                
                // Calculate Store Sub-totals
                const storeSubtotal = storeItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                const storeTax = storeSubtotal * TAX_RATE;
                const storeShipping = SHIPPING_COST; // Flat rate per store
                const storeTotal = storeSubtotal + storeTax + storeShipping;

                // Distribute Discount Pro-rata based on subtotal contribution
                // Ratio = StoreSubtotal / GlobalSubtotal (using subtotal is standard)
                // If globalSubtotal is 0 (free items?), ratio is 0. 
                const ratio = globalSubtotal > 0 ? (storeSubtotal / globalSubtotal) : 0;
                const storeDiscount = globalDiscountAmount * ratio;
                const storeFinal = Math.max(0, storeTotal - storeDiscount);

                const childOrder = new Order({
                    user,
                    items: storeItems,
                    subtotal: storeSubtotal,
                    tax: storeTax,
                    shippingCost: storeShipping,
                    totalAmount: storeTotal,
                    discountAmount: storeDiscount, // Approximate split
                    finalAmount: storeFinal,
                    status: 'pending',
                    paymentStatus: 'pending', // Will update when Parent is paid
                    paymentMethod,
                    shippingAddress,
                    billingAddress,
                    store: storeId === 'admin' ? null : storeId, // Link to store
                    parentOrder: parentOrder._id
                });

                await childOrder.save({ session });
                childOrderIds.push(childOrder._id);
            }

            // 5. Update Parent with Children
            parentOrder.children = childOrderIds;
            await parentOrder.save({ session });

            await session.commitTransaction();
            return parentOrder;
         } catch(err) {
             await session.abortTransaction();
             throw err;
         } finally {
             session.endSession();
         }
    }

    static async getOrders(userId:string | mongoose.Types.ObjectId): Promise<IOrder[]> {
        // Only return Parent Orders (orders that don't have a parentOrder field or it is null)
        return Order.find({ user: userId, parentOrder: { $exists: false } })
            .populate('items.product')
            .sort({ createdAt: -1 });
    }

    static async getVendorOrders(storeId: string): Promise<IOrder[]> {
        return Order.find({ store: storeId })
            .populate('user', 'name email')
            .populate('items.product')
            .sort({ createdAt: -1 });
    }

    static async getOrderById(id: string): Promise<IOrder | null> {
        return Order.findById(id)
            .populate('items.product')
            .populate('children'); // Populate children for detail view
    }

    static async updateOrderStatus(id: string, status: string): Promise<IOrder | null> {
        return Order.findByIdAndUpdate(id, { status }, { new: true });
    }
}