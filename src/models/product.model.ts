import mongoose, { Document, Schema } from 'mongoose';
import {IReview} from "./review.model";
import {IStore} from "./store.model";
import slugify from "slugify";
 export interface IGalleryImage {
    _id?: any;
    url?: string | undefined;
    publicId?: string | undefined;
}

export interface IProduct extends Document {
    name: string;
    slug: string;
    description: string;
    htmlDescription: string;
    price: number;
    category: string[];
    imageUrl: string;
    imagePublicId?: string
    gallery?: IGalleryImage[]
    reviews: IReview['_id'][];
    averageRating: number;
    reviewCount: number;
    stock:number | null;
    store: IStore['_id'];
    status: 'pending' | 'approved' | 'rejected';
}
const GalleryImageSchema = new Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
})
const productSchema = new Schema<IProduct>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    htmlDescription: { type: String, required: true },
    price: { type: Number, required: true },
    category: [{ type: String, required: true }],
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String },
    gallery: [GalleryImageSchema],
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    stock:{ type: Number,required: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
}, { timestamps: true });
productSchema.pre('validate', async function (next) {
    if (!this.isModified('name')) return next();
    
    // Generate base slug
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;

    // Atomic-like check: If slug exists, append random string instead of sequential count
    // This reduces race condition probability compared to sequential incrementing
    const slugExists = await mongoose.model('Product').exists({ slug });
    
    if (slugExists) {
        // Appending 6 char random hex string
         const suffix = Math.random().toString(16).substring(2, 8);
         slug = `${baseSlug}-${suffix}`;
    }
    
    this.slug = slug;
    next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema);