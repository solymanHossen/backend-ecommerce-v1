import {IReview, Review} from '../models/review.model';
import {Product} from '../models/product.model';
import mongoose from 'mongoose';
import logger from "../utils/logger";

export class ReviewService {
    static async createReview(reviewData: Partial<IReview>): Promise<IReview> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const review = new Review(reviewData);
           await review.save({ session });
            const product = await Product.findById(review.product).session(session);
            if (!product) {
                throw new Error('Product not found');
            }

            product.reviews.push(review._id);
            product.reviewCount += 1;
            product.averageRating = (product.averageRating * (product.reviewCount - 1) + review.rating);
            await product.save({ session });

            await session.commitTransaction();
            return review;
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            throw error;
        } finally {
          await  session.endSession();
        }
    }

    static async getReviewsByProduct(productId: string): Promise<IReview[]> {
        return Review.find({ product: productId }).populate('user', 'name');
    }
    static async getReviewsByReview(reviewId: string): Promise<IReview[] | null> {
        return Review.find({_id: reviewId}).populate('user', 'name');
    }
    static async updateReview(reviewId: string, updateData: Partial<IReview>): Promise<IReview | null> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const review = await Review.findByIdAndUpdate(reviewId, updateData, { new: true, session });
            if (!review) {
                throw new Error('Review not found');
            }

            const product = await Product.findById(review.product).session(session);
            if (!product) {
                throw new Error('Product not found');
            }

            const reviews = await Review.find({ product: product._id }).session(session);
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            product.averageRating = totalRating / reviews.length;
            await product.save({ session });

            await session.commitTransaction();
            return review;
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async deleteReview(reviewId: string): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const review = await Review.findByIdAndDelete(reviewId).session(session);
            if (!review) {
                throw new Error('Review not found');
            }

            const product = await Product.findById(review.product).session(session);
            if (!product) {
                throw new Error('Product not found');
            }

            product.reviews = product.reviews.filter((r:any) => r.toString() !== reviewId);
            product.reviewCount -= 1;

            if (product.reviewCount > 0) {
                const reviews = await Review.find({ product: product._id }).session(session);
                const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                product.averageRating = totalRating / reviews.length;
            } else {
                product.averageRating = 0;
            }

            await product.save({ session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

}