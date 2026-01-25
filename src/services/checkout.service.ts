import { Cart } from "../models/cart.model";
import { Order, IOrder, IOrderItem } from "../models/order.model";
import { User } from "../models/user.model";
import { IProduct, Product } from "../models/product.model";
import { PromotionService } from "./promotion.service";
import { IPromotion } from "../models/promotion.model";
import { AppError } from "../utils/AppError";
import Stripe from "stripe";
import mongoose, { Schema } from "mongoose";
import { ICartItem } from "../models/cart-item.model";
import dotenv from "dotenv";
import { OrderService } from "./order.service";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string,{
apiVersion: '2024-12-18.acacia'as Stripe.LatestApiVersion,
});

export class CheckoutService {
  static async createCheckoutSession(
    userId: string | mongoose.Types.ObjectId,
    shippingAddress: IOrder["shippingAddress"],
    billingAddress: IOrder["billingAddress"],
    promotionCode?: string
  ): Promise<{ sessionId: string; orderId: string }> {
    // Start verify cart session
    const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items',
        populate: { path: 'product' }
    });
    
    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }


    // Prepare items for OrderService
    const orderItems = cart.items.map((item: any) => ({
        product: item.product._id ? item.product._id.toString() : item.product.toString(),
        quantity: item.quantity
    }));

    // Create Order using centralized secure service
    // This handles price calculation, stock checks, and promotion validation securely.
    const order = await OrderService.createOrder({
        user: userId,
        items: orderItems,
        shippingAddress,
        billingAddress,
        paymentMethod: 'credit_card', // Default for Stripe checkout
        promotionCode
    });

    // Populate order items to get details for Stripe
    await order.populate('items.product');

    // Create Stripe Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
            ...order.items.map((item: any) => {
             const product = item.product; 
             // Ensure we use the price from the ORDER (which came from DB)
             // Order stores unit price in items
             return {
                price_data: {
                  currency: "usd",
                  product_data: {
                    name: product.name,
                    images: [product.imageUrl],
                  },
                  unit_amount: Math.round(item.price * 100), 
                },
                quantity: item.quantity,
              };
             }),
             // Add Tax Line Item
             {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Tax",
                    },
                    unit_amount: Math.round(order.tax * 100),
                },
                quantity: 1,
             },
             // Add Shipping Line Item
             {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Shipping Cost",
                    },
                    unit_amount: Math.round(order.shippingCost * 100),
                },
                quantity: 1,
             }
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        customer_email: (await User.findById(userId))?.email ?? "",
        metadata: {
          orderId: order._id.toString(),
        },
    };

    const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    // Update order with payment intent placeholder or session info if needed
    // order.paymentIntentId = stripeSession.payment_intent as string; // Not available yet usually
    // await order.save(); 

    return { sessionId: stripeSession.id, orderId: order._id.toString() };
  }

  static async handleStripeWebhook(stripeSession: Stripe.Checkout.Session): Promise<void> {
    const orderId = stripeSession.metadata?.orderId;

    if (!orderId) {
      throw new AppError("Order ID not found in session metadata", 400);
    }

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      const order = await Order.findById(orderId).session(mongoSession);
      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // Idempotency check: if order is already paid, do nothing
      if (order.paymentStatus === "paid") {
        await mongoSession.commitTransaction();
        return;
      }

      if (stripeSession.payment_status === "paid") {
         // Atomic stock deduction
        const stockUpdatePromises = order.items.map(async (item) => {
          const result = await Product.findOneAndUpdate(
            {
              _id: item.product,
              stock: { $gte: item.quantity }, // Ensure sufficient stock
            },
            {
              $inc: { stock: -item.quantity },
            },
            {
              session: mongoSession,
              new: true,
            }
          );

          if (!result) {
            throw new AppError(
              `Insufficient stock for product ${item.product}. Order cannot be completed.`,
              400
            );
          }
        });

        await Promise.all(stockUpdatePromises);

        // Update order status
        order.paymentStatus = "paid";
        order.status = "processing";
        order.paymentIntentId = stripeSession.payment_intent as string;
        await order.save({ session: mongoSession });

        // Clear the user's cart
        await Cart.findOneAndUpdate(
          { user: order.user },
          { $set: { items: [], totalAmount: 0 } },
          { session: mongoSession }
        );

        // Delete cart items
        const cart = await Cart.findOne({ user: order.user }).session(mongoSession);
        if (cart && cart.items.length > 0) {
          await mongoose.model('CartItem').deleteMany(
            { _id: { $in: cart.items } },
            { session: mongoSession }
          );
        }
      } else {
        // Handle failed/expired sessions if needed
        order.paymentStatus = "failed";
        order.status = "cancelled";
        await order.save({ session: mongoSession });
      }

      await mongoSession.commitTransaction();
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  }

  // Deprecated: Logic moved to handleStripeWebhook
  // This method now only returns the order status for client polling
  static async confirmOrder(sessionId: string): Promise<IOrder> {
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      const orderId = stripeSession.metadata?.orderId;
      if (!orderId) throw new AppError("Order ID not found", 400);
      
      const order = await Order.findById(orderId);
      if (!order) throw new AppError("Order not found", 404);
      
      return order;
  }



  static async getOrderSummary(orderId: string, userId?: string): Promise<IOrder> {
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // SECURITY FIX: Validate ownership unless accessed from webhook/admin context
    if (userId && order.user?.toString() !== userId.toString()) {
      throw new AppError("Access denied. You do not own this order.", 403);
    }

    return order;
  }
}
