import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';
import { IUser } from './user.model';

export interface IStore extends Document {
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    owner: IUser['_id'];
    status: 'pending' | 'active' | 'banned';
    commissionRate: number;
    balance: number;
}

const storeSchema = new Schema<IStore>({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String },
    logo: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'banned'], 
        default: 'pending' 
    },
    commissionRate: { type: Number, default: 10 },
    balance: { type: Number, default: 0 }
}, { timestamps: true });

storeSchema.pre('validate', async function (next) {
    if (!this.isModified('name')) return next();
    
    // Generate base slug
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    
    // Check for unique slug
    let counter = 0;
    while (await mongoose.models.Store.findOne({ slug, _id: { $ne: this._id } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
    }
    
    this.slug = slug;
    next();
});

export const Store = mongoose.model<IStore>('Store', storeSchema);
