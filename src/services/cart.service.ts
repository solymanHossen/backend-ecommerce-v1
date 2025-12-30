import {Cart, ICart} from '../models/cart.model';
import {CartItem, ICartItem} from '../models/cart-item.model';
import {IProduct, Product} from '../models/product.model';
import {User} from '../models/user.model';
import mongoose, {Schema} from 'mongoose';
import logger from "../utils/logger";

export class CartService {
    static async getCart(userId: string | mongoose.Types.ObjectId): Promise<ICart | null> {
        return Cart.findOne({user: userId}).populate({
            path: 'items',
            populate: {path: 'product'}
        });
    }

    static async addToCart(userId: string | mongoose.Types.ObjectId, productId: string, quantity: number): Promise<ICart> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let cart = await Cart.findOne({user: userId}).session(session);
            if (!cart) {
                cart = new Cart({user: userId, items: [], totalAmount: 0});
                await cart.save({session});
                await User.findByIdAndUpdate(userId, {cart: cart._id}, {session});
            }

            const product = await Product.findById(productId).session(session);
            if (!product) {
                throw new Error('Product not found');
            }

            if ((product.stock ?? 0) < quantity) {
                throw new Error('Not enough stock');
            }

            let cartItem = await CartItem.findOne({cart: cart._id, product: productId}).session(session);
            if (cartItem) {
                cartItem.quantity += quantity;
                cartItem.price = product.price * cartItem.quantity;
                await cartItem.save({session});
            } else {
                cartItem = new CartItem({
                    product: productId,
                    quantity,
                    price: product.price * quantity
                });
                await cartItem.save({session});
                cart.items.push(cartItem._id as mongoose.Types.ObjectId);
            }

            cart.totalAmount = await this.calculateCartTotal(cart._id, session);
            await cart.save({session});

            await session.commitTransaction();
            return cart;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async removeFromCart(userId: string | mongoose.Types.ObjectId, cartItemId: string): Promise<ICart> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const cart = await Cart.findOne({user: userId}).session(session);
            if (!cart) {
                throw new Error('Cart not found');
            }

            cart.items = cart.items.filter(item => item.toString() !== cartItemId);
            await CartItem.findByIdAndDelete(cartItemId).session(session);

            cart.totalAmount = await this.calculateCartTotal(cart._id, session);
            await cart.save({session});

            await session.commitTransaction();
            return cart;
        } catch (error) {
            await session.abortTransaction();
            throw error
        } finally {
            session.endSession();
        }
    }

    static async updateCartItemQuantity(userId: string | mongoose.Types.ObjectId, cartItemId: string, quantity: number): Promise<ICart> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const cart = await Cart.findOne({user: userId}).session(session);
            if (!cart) {
                throw new Error('Cart not found');
            }

            const cartItem = await CartItem.findById(cartItemId).populate('product').session(session);

            if (!cartItem) {
                throw new Error('Cart item not found');
            }
            const product = cartItem.product as unknown as IProduct;

            if (cartItem) {
                if ((product.stock ?? 0) < quantity) {
                    throw new Error('Not enough stock');
                }
            }

            cartItem.quantity = quantity;
            cartItem.price = product.price * quantity;
            await cartItem.save({session});

            cart.totalAmount = await this.calculateCartTotal(cart._id, session);
            await cart.save({session});

            await session.commitTransaction();
            return cart;
        } catch (error) {
            logger.error(error);
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

      static async clearCart(userId: string | mongoose.Types.ObjectId): Promise<void> {
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
              const cart = await Cart.findOne({ user: userId }).session(session);
              if (!cart) {
                  throw new Error('Cart not found');
              }

              await CartItem.deleteMany({ _id: { $in: cart.items } }).session(session);
              cart.items = [];
              cart.totalAmount = 0;
              await cart.save({ session });

              await session.commitTransaction();
          } catch (error) {
              await session.abortTransaction();
              throw error;
          } finally {
              session.endSession();
          }
      }

    private static async calculateCartTotal(cartId: string | mongoose.Types.ObjectId, session: mongoose.ClientSession): Promise<number> {
        const cartItems = await CartItem.find({_id: {$in: (await Cart.findById(cartId).session(session))?.items}}).session(session);
        return cartItems.reduce((total, item) => total + item.price, 0);
    }
}