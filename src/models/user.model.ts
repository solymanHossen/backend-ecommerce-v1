import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import {ICart} from "./cart.model";
import {IWishlist} from "./wishlist.model";

export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    role: 'user' | 'admin';
    profilePicture?: string;
    bio?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    isVerified: boolean;
    verificationOTP?: string;
    otpExpires?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    obId:Schema.Types.ObjectId | string;
    phoneNumber?: string;
    cart: ICart['_id'];
    wishlist: IWishlist['_id'];
    comparePassword(candidatePassword: string): Promise<boolean>;
    refreshToken?: string;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true,lowercase: true , trim: true},
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profilePicture: { type: String },
    bio: { type: String },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String },
    },
    isVerified: { type: Boolean, default: false },
    verificationOTP: { type: String },
    otpExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    phoneNumber: { type: String },
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' },
    wishlist: { type: Schema.Types.ObjectId, ref: 'Wishlist' },
    refreshToken: { type: String },
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);