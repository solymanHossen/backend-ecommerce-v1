import mongoose, {Document, Schema, Types} from 'mongoose';
import { IUser } from './user.model';
import { IProduct } from './product.model';

export interface IReview extends Document {
    user: Types.ObjectId;
    product: Types.ObjectId;
    rating: number;
    title: string;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 100 },
    comment: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);