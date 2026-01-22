import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UserService.getUserProfile(req.user!._id);
    if (!user) {
         throw new AppError('User not found', 404);
    }
    sendResponse(res, 200, true, "User profile fetched successfully", { user });
});

export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updatedUser = await UserService.updateUser(req.user!._id, req.body);
    if (!updatedUser) {
        throw new AppError('User not found', 404);
    }
    sendResponse(res, 200, true, "User profile updated successfully", updatedUser);
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const deletedUser = await UserService.deleteUser(req.user!._id);
    if (!deletedUser) {
        throw new AppError('User not found', 404);
    }
    sendResponse(res, 200, true, "User deleted successfully");
});
