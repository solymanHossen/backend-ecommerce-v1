import { Request, Response } from 'express';
import { PromotionService } from '../services/promotion.service';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const createPromotion = asyncHandler(async (req: Request, res: Response) => {
    const promotion = await PromotionService.createPromotion(req.body);
    sendResponse(res, 201, true, "Promotion created successfully", promotion);
});

export const getPromotions = asyncHandler(async (req: Request, res: Response) => {
    const promotions = await PromotionService.getPromotions();
    sendResponse(res, 200, true, "Promotions fetched successfully", promotions);
});

export const updatePromotion = asyncHandler(async (req: Request, res: Response) => {
    const promotion = await PromotionService.updatePromotion(req.params.id, req.body);
    if (!promotion) {
        throw new AppError('Promotion not found', 404);
    }
    sendResponse(res, 200, true, "Promotion updated successfully", promotion);
});

export const deletePromotion = asyncHandler(async (req: Request, res: Response) => {
    const promotion = await PromotionService.deletePromotion(req.params.id);
    if (!promotion) {
        throw new AppError('Promotion not found', 404);
    }
    sendResponse(res, 200, true, 'Promotion deleted successfully');
});

export const getPromotionEffectiveness = asyncHandler(async (req: Request, res: Response) => {
    const effectiveness = await PromotionService.getPromotionEffectiveness(req.params.id);
    sendResponse(res, 200, true, "Promotion effectiveness fetched successfully", effectiveness);
});
