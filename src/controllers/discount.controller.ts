import { Request, Response } from 'express';
import { DiscountService } from '../services/discount.service';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const createDiscount = asyncHandler(async (req: Request, res: Response) => {
    const discount = await DiscountService.createDiscount(req.body);
    sendResponse(res, 201, true, "Discount created successfully", discount);
});

export const getDiscounts = asyncHandler(async (req: Request, res: Response) => {
    const discounts = await DiscountService.getDiscounts();
    sendResponse(res, 200, true, "Discounts fetched successfully", discounts);
});

export const updateDiscount = asyncHandler(async (req: Request, res: Response) => {
    const discount = await DiscountService.updateDiscount(req.params.id, req.body);
    if (!discount) {
        throw new AppError('Discount not found', 404);
    }
    sendResponse(res, 200, true, "Discount updated successfully", discount);
});

export const deleteDiscount = asyncHandler(async (req: Request, res: Response) => {
    const discount = await DiscountService.deleteDiscount(req.params.id);
    if (!discount) {
         throw new AppError('Discount not found', 404);
    }
    sendResponse(res, 200, true, 'Discount deleted successfully');
});
