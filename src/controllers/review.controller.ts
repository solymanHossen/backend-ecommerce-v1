import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { AuthRequest } from '../middleware/auth.middleware';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviewData = {
        user: req.user!._id,
        product: req.params.productId,
        ...req.body
    };
    const review = await ReviewService.createReview(reviewData);
    sendResponse(res, 201, true, "Review created successfully", review);
});

export const getReviewsByProduct = asyncHandler(async (req: Request, res: Response) => {
    const reviews = await ReviewService.getReviewsByProduct(req.params.productId);
    sendResponse(res, 200, true, "Reviews fetched successfully", reviews);
});

export const updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Fetch first to verify ownership safely
    const reviews = await ReviewService.getReviewsByReview(req.params.reviewId);
    if (!reviews || reviews.length === 0) {
        throw new AppError("Review not found", 404);
    }

    // Check if user matches. Using optional chaining and safeguards
    // deleteReview usage: review[0].user._id.toString()
    const reviewUser = reviews[0].user;
    const reviewUserId = reviewUser._id ? reviewUser._id.toString() : reviewUser.toString();
    
    if (reviewUserId !== req.user!._id.toString()) {
         throw new AppError("Not authorized to update this review", 403);
    }

    const updatedReview = await ReviewService.updateReview(req.params.reviewId, req.body);
    sendResponse(res, 200, true, "Review updated successfully", updatedReview);
});

export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviewId = req.params.reviewId;
    const reviews = await ReviewService.getReviewsByReview(reviewId);
    
    if (!reviews || reviews.length === 0) {
         throw new AppError("Review not found", 404);
    }
    
    const reviewUser = reviews[0].user;
    const reviewUserId = reviewUser._id ? reviewUser._id.toString() : reviewUser.toString();

    if (reviewUserId !== req.user!._id.toString()) {
        throw new AppError("Not authorized to delete this review", 403);
    }
    
    await ReviewService.deleteReview(reviewId);
    sendResponse(res, 200, true, "Review deleted successfully");
});
