import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
    type: string;
    theme?: string;
    isDark?: boolean;
    value?: any;
}

const settingSchema = new Schema<ISetting>({
    type: { type: String, required: true, unique: true },
    theme: { type: String },
    isDark: { type: Boolean, default: false },
    value: { type: Schema.Types.Mixed }
}, { timestamps: true });

export const Setting = mongoose.model<ISetting>('Setting', settingSchema);
