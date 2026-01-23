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
    // SECURITY FIX: Whitelist allowed fields to prevent Mass Assignment
    const allowedFields = ['name', 'profilePicture', 'bio', 'address', 'phoneNumber'];
    const updateData: any = {};
    
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updateData[key] = req.body[key];
        }
    });

    if (Object.keys(updateData).length === 0) {
         throw new AppError('No valid fields to update', 400);
    }

    const updatedUser = await UserService.updateUser(req.user!._id, updateData);
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
