import mongoose, { Document, Schema } from 'mongoose';
import { IProduct } from './product.model';

export interface ICartItem extends Document {
    product: IProduct['_id'];
    quantity: number;
    price: number;

}

const cartItemSchema = new Schema<ICartItem>({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
}, { timestamps: true });

export const CartItem = mongoose.model<ICartItem>('CartItem', cartItemSchema);