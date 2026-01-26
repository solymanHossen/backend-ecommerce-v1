import { Request, Response } from 'express';
import { storeService } from '../services/store.service';
import { asyncHandler } from '../utils/asyncHandler';
import sendResponse from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const registerStore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await storeService.createStore(req.user!._id, req.body);
    sendResponse(res, 201, true, "Store created successfully", store);
});

export const getMyStore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await storeService.getStoreByOwner(req.user!._id);
    sendResponse(res, 200, true, "Store retrieved successfully", store);
});

export const getStoreBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const store = await storeService.getStoreBySlug(slug);
    sendResponse(res, 200, true, "Store retrieved successfully", store);
});

export const updateStore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const myStore = await storeService.getStoreByOwner(req.user!._id);
    const updatedStore = await storeService.updateStore(myStore._id as string, req.body);
    sendResponse(res, 200, true, "Store updated successfully", updatedStore);
});
