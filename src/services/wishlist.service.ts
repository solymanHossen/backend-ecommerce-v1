import { Wishlist, IWishlist } from '../models/wishlist.model';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { Discount } from '../models/discount.model';
import mongoose, {Schema} from 'mongoose';
import crypto from 'crypto';
import { AppError } from '../utils/AppError';

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
                throw new AppError('Product not found', 404);
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

    static async checkForDiscounts(userId: string | mongoose.Types.ObjectId): Promise<{ productId: string; discountName: string; discountValue: number; type: string }[]> {
        const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
        if (!wishlist) {
            throw new Error('Wishlist not found');
        }

        const now = new Date();
        const activeDiscounts = await Discount.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        if (!activeDiscounts || activeDiscounts.length === 0) {
            return [];
        }

        const discountedItems: any[] = [];

        for (const product of wishlist.products as any[]) {
            // Find best discount for this product
            let bestDiscount = null;
            let maxSavings = 0; // Relative score to compare fixed vs percentage 
            // (Note: To compare fairly, we need price. Assuming fixed value is in currency and percentage is %)
            
            for (const discount of activeDiscounts) {
                let applies = false;
                
                // Check Product match
                if (discount.applicableProducts && discount.applicableProducts.map(p => p.toString()).includes(product._id.toString())) {
                    applies = true;
                }
                
                // Check Category match
                if (!applies && discount.applicableCategories && product.category) {
                    const productCategories = product.category; // string[]
                    const hasCategoryMatch = discount.applicableCategories.some(cat => productCategories.includes(cat));
                    if (hasCategoryMatch) {
                        applies = true;
                    }
                }

                if (applies) {
                    // Simple heuristic: we just return detailed info.
                    // If multiple discounts apply, handling that requires a policy (stackable? max only?)
                    // For this fix, we will push the FIRST valid one or logic to pick one.
                    
                    // Let's implement logic to find the 'highest value' if needed, but for 'Phantom Field' fix, 
                    // correctness of retrieving ANY valid discount is the priority.
                    
                    // We'll replace the phantom check with this:
                    discountedItems.push({
                        productId: product._id, 
                        discountName: discount.name,
                        discountValue: discount.value,
                        type: discount.type
                    });
                     // Limit to one discount per product to avoid duplicates in view, or return all.
                     // Breaking inner loop ensures one discount per product (the first found).
                     break; 
                }
            }
        }

        return discountedItems;
    }
}