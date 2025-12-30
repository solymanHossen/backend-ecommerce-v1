import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

export interface ICart extends Document {
    user: IUser['_id'] | undefined;
    items: mongoose.Types.ObjectId[];
    totalAmount: number;
}

const cartSchema = new Schema<ICart>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ type: Schema.Types.ObjectId, ref: 'CartItem' }],
    totalAmount: { type: Number, default: 0 },
}, { timestamps: true });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);