import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGlobalSetting extends Document {
  siteName: string;
  taxRate: number;
  shippingCost: number;
  currency: string;
  supportEmail?: string;
  isMaintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IGlobalSettingModel extends Model<IGlobalSetting> {
  getSingleton(): Promise<IGlobalSetting>;
}

const globalSettingSchema = new Schema<IGlobalSetting>(
  {
    siteName: {
      type: String,
      required: true,
      default: 'My E-Commerce Site',
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    supportEmail: {
      type: String,
    },
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Add a capped collection or simple limit logic? 
    // Usually for singleton settings, we just ensuring the service only creates one.
    // We can also make a unique index on a constant field if we really wanted to enforce it at DB level,
    // but typically application logic suffices.
  }
);

// Static method to ensure Singleton behavior
globalSettingSchema.statics.getSingleton = async function (): Promise<IGlobalSetting> {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  // Create default settings if none exist
  return await this.create({
    siteName: 'My E-Commerce Store',
    taxRate: 0.1, // Default 10%
    shippingCost: 10, // Default $10
    currency: 'USD',
    isMaintenanceMode: false
  });
};

export const GlobalSetting = mongoose.model<IGlobalSetting, IGlobalSettingModel>('GlobalSetting', globalSettingSchema);
