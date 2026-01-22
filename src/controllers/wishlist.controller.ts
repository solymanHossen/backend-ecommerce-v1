import { Request, Response } from 'express';
import { WishlistService } from '../services/wishlist.service';
import { AuthRequest } from '../middleware/auth.middleware';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await WishlistService.getWishlist(req.user!._id);
    sendResponse(res, 200, true, "Wishlist fetched successfully", wishlist);
});

export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.body;
    const wishlist = await WishlistService.addToWishlist(req.user!._id, productId);
    sendResponse(res, 200, true, "Added to wishlist", wishlist);
});

export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const wishlist = await WishlistService.removeFromWishlist(req.user!._id, productId);
    sendResponse(res, 200, true, "Removed from wishlist", wishlist);
});

export const clearWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    await WishlistService.clearWishlist(req.user!._id);
    sendResponse(res, 200, true, "Wishlist cleared successfully");
});

export const generateShareableLink = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shareableLink = await WishlistService.generateShareableLink(req.user!._id);
    sendResponse(res, 200, true, "Shareable link generated", { shareableLink });
});

export const getSharedWishlist = asyncHandler(async (req: Request, res: Response) => {
    const { shareableLink } = req.params;
    const wishlist = await WishlistService.getWishlistByShareableLink(shareableLink);
    if (!wishlist) {
         throw new AppError('Shared wishlist not found', 404);
    }
    sendResponse(res, 200, true, "Shared wishlist fetched successfully", wishlist);
});

export const checkForDiscounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const discountedItems = await WishlistService.checkForDiscounts(req.user!._id);
    sendResponse(res, 200, true, "Discounts checked", discountedItems);
});
