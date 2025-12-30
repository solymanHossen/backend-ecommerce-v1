import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscount extends Document {
    name: string;
    description: string;
    type: 'percentage' | 'fixed';
    value: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    minPurchaseAmount?: number;
    applicableProducts?: string[];
    applicableCategories?: string[];
}

const discountSchema = new Schema<IDiscount>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    minPurchaseAmount: { type: Number },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: String }],
}, { timestamps: true });

export const Discount = mongoose.model<IDiscount>('Discount', discountSchema);