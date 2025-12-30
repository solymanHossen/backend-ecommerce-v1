import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';
import { IProduct } from './product.model';

export interface IWishlist extends Document {
    user: IUser['_id'];
    products: IProduct['_id'][];
    shareableLink?: string;
}

const wishlistSchema = new Schema<IWishlist>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    shareableLink: { type: String, unique: true, sparse: true },
}, { timestamps: true });

wishlistSchema.index({ user: 1, 'products': 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);