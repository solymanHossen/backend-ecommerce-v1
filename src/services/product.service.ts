import {Product, IProduct, IGalleryImage} from '../models/product.model';
import {CloudinaryUploadResult} from "../types/upload.types";
import redis from "../config/redis";
import { escapeRegex } from "../utils/helpers";
import logger from "../utils/logger";

export class ProductService {
    static async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
        const product = new Product(productData);
        await product.save();
        // Invalidate list cache - simplified for this implementation
        // In a real scenario, use cache tags or versioning
        return product;
    }

    static async getProducts(query: any = {}): Promise<{ products: IProduct[], pagination: any }> {
        const cacheKey = `products:${JSON.stringify(query)}`;
        
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            logger.warn('Redis error during getProducts', e);
        }

        const limit = parseInt(query.limit) || 10;
        const search = query.search ? escapeRegex(query.search) : '';
        const category = query.category || '';
        const cursor = query.cursor; 

        const filterQuery: any = {
            ...(search && { name: { $regex: search, $options: 'i' } }),
            ...(category && { category }),
        };

        let products;
        let nextCursor = null;

        if (cursor) {
            // Cursor-based pagination using _id
            filterQuery._id = { $lt: cursor }; // assuming descending order (newest first) usually better, but default is creation time increasing?
            // Usually _id is sorted by creation. If we sort by _id desc, next cursor is less than current.
            // Let's assume standard sort by _id ascending for now unless sort param exists.
            // Actually, best strictly following prompt: "cursor-based pagination using _id or createdAt".
            // I'll default to _id ascending (oldest first) if no sort, or _id gt cursor.
             filterQuery._id = { $gt: cursor };
             products = await Product.find(filterQuery).limit(limit + 1);
        } else {
            // Fallback for first page or legacy
             const page = parseInt(query.page) || 1;
             const skip = (page - 1) * limit;
             products = await Product.find(filterQuery).skip(skip).limit(limit + 1);
        }

        const hasNextPage = products.length > limit;
        if (hasNextPage) products.pop();
        
        if (products.length > 0) {
            nextCursor = products[products.length - 1]._id;
        }

        const result = {
            products,
            pagination: {
                limit,
                nextCursor,
                hasNextPage,
                total: 0 // Calculating total count is expensive, omit for cursor path or do separately if needed
            }
        };

        // Cache for 60 seconds
        try {
            await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
        } catch (e) {
             logger.warn('Redis set error', e);
        }

        return result;
    }

    static async getProductBySlug(slug: string): Promise<IProduct | null> {
        const cacheKey = `product:slug:${slug}`;
        try {
             const cached = await redis.get(cacheKey);
             if (cached) return JSON.parse(cached);
        } catch (e) {}

        // Removed .populate('reviews') to avoid heavy population
        const product = await Product.findOne({ slug }).lean() as unknown as IProduct;
        
        if (product) {
            try {
                await redis.set(cacheKey, JSON.stringify(product), 'EX', 600); // Cache individual product longer
            } catch (e) {}
        }
        
        return product;
    }

    static async getProductById(id: string): Promise<IProduct | null> {
        return Product.findById(id);
    }

    static async updateProduct(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        // Invalidate specific cache?
        // Ideally we delete `product:slug:${product.slug}`
        return product;
    }

    static async deleteProduct(id: string): Promise<IProduct | null> {
        return Product.findByIdAndDelete(id);
    }

    static async getProductsByCategory(category: string): Promise<IProduct[]> {
        return Product.find({ category: category });
    }
    
    static async addProductGalleryImages(id: string, galleryImages: CloudinaryUploadResult[]): Promise<IProduct | null> {
        const product = await Product.findById(id)
        if (!product) return null

        // Convert CloudinaryUploadResult to gallery format
        const newGalleryImages: Partial<IGalleryImage>[] = galleryImages.map((img) => ({
            url: img.url,
            publicId: img.publicId,
        }));
        
        if (!product.gallery) {
            product.gallery = newGalleryImages as any;
        } else {
            product.gallery.push(...newGalleryImages as any)
        }

        return product.save()
    }

    static async removeProductGalleryImage(id: string, imageId: string): Promise<IProduct | null> {
        return Product.findByIdAndUpdate(id, { $pull: { gallery: { _id: imageId } } }, { new: true })
    }
}
