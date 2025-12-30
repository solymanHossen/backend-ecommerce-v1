import { Wishlist, IWishlist } from '../models/wishlist.model';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import mongoose, {Schema} from 'mongoose';
import crypto from 'crypto';

export class WishlistService {
    static async getWishlist(userId: string | mongoose.Types.ObjectId): Promise<IWishlist | null> {
        return Wishlist.findOne({ user: userId }).populate('products');
    }

    static async addToWishlist(userId: string | mongoose.Types.ObjectId, productId: string): Promise<IWishlist> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let wishlist = await Wishlist.findOne({ user: userId }).session(session);
            if (!wishlist) {
                wishlist = new Wishlist({ user: userId, products: [] });
                await wishlist.save({ session });
                await User.findByIdAndUpdate(userId, { wishlist: wishlist._id }, { session });
            }

            const product = await Product.findById(productId).session(session);
            if (!product) {
                throw new Error('Product not found');
            }

            if (!wishlist.products.includes(productId as any)) {
                wishlist.products.push(productId as any);
                await wishlist.save({ session });
            }

            await session.commitTransaction();
            return wishlist;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async removeFromWishlist(userId: string | mongoose.Types.ObjectId, productId: string): Promise<IWishlist> {
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            throw new Error('Wishlist not found');
        }
        const product = wishlist.products;
        wishlist.products = product.filter(id => id.toString() !== productId);
        await wishlist.save();

        return wishlist;
    }

    static async clearWishlist(userId: string | mongoose.Types.ObjectId): Promise<void> {
        const wishlist = await Wishlist.findOne({ user: userId });
        console.log(wishlist,'this is wishlist')
        if (!wishlist) {
            throw new Error('Wishlist not found');
        }

        wishlist.products = [];
        await wishlist.save();
    }

    static async generateShareableLink(userId: string | mongoose.Types.ObjectId): Promise<string> {
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            throw new Error('Wishlist not found');
        }

        if (!wishlist.shareableLink) {
            wishlist.shareableLink = crypto.randomBytes(16).toString('hex');
            await wishlist.save();
        }

        return wishlist.shareableLink;
    }

    static async getWishlistByShareableLink(shareableLink: string): Promise<IWishlist | null> {
        return Wishlist.findOne({ shareableLink }).populate('products');
    }

    static async checkForDiscounts(userId: string | mongoose.Types.ObjectId): Promise<{ productId: string; discount: number }[]> {
        const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
        if (!wishlist) {
            throw new Error('Wishlist not found');
        }

        const discountedItems = wishlist.products.map((product: any) => {
            if (product.discountPercentage > 0) {
                return { productId: product._id, discount: product.discountPercentage };
            }
            return null;
        }).filter(item => item !== null);

        return discountedItems;
    }
}