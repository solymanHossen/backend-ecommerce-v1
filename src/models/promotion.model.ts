import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotion extends Document {
    name: string;
    description: string;
    type: 'percentage' | 'fixed';
    value: number;
    code: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    usageLimit: number;
    usageCount: number;
    minPurchaseAmount?: number;
    applicableProducts?: string[];
    applicableCategories?: string[];
}

const promotionSchema = new Schema<IPromotion>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true },
    code: { type: String, required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, required: true },
    usageCount: { type: Number, default: 0 },
    minPurchaseAmount: { type: Number },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: String }],
}, { timestamps: true });

export const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema);