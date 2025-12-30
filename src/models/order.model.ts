import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';
import { IProduct } from './product.model';
import {IPromotion} from "./promotion.model";

export interface IOrderItem {
    product: IProduct['_id'];
    quantity: number;
    price: number;
}
export interface IShippingAddress {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface IBillingAddress {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export interface IOrder extends Document {
    user:IUser['_id'] | undefined;
    items: IOrderItem[];
    subtotal: number;
    tax: number;
    shippingCost: number;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'failed';
    paymentMethod: 'credit_card' | 'paypal';
    paymentIntentId?: string;
    shippingAddress: IShippingAddress;
    billingAddress: IBillingAddress;
    promotion?: IPromotion['_id'];
}

const orderSchema = new Schema<IOrder>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
    }],
    subtotal:{ type: Number, required: true },
    tax: { type: Number,default:0 },
    shippingCost: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['credit_card', 'paypal'], required: true ,default: 'credit_card' },
    paymentIntentId: { type: String },
    shippingAddress: {
        fullName: { type: String },
        addressLine1: { type: String },
        addressLine2: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String},
        country: { type: String},
    },
    billingAddress: {
        fullName: { type: String},
        addressLine1: { type: String},
        addressLine2: { type: String },
        city: { type: String},
        state: { type: String },
        postalCode: { type: String},
        country: { type: String },
    },
    promotion: { type: Schema.Types.ObjectId, ref: 'Promotion' },
}, { timestamps: true });

export const Order = mongoose.model<IOrder>('Order', orderSchema);