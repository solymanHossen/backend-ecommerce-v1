import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from "../utils/logger";
import sendResponse from "../utils/response";

export const getUserProfile = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const user = await UserService.getUserProfile(req.user!._id) ;
        if (!user) {
             res.status(404).json({ message: 'User not found' }); return ;
        }
        sendResponse(res, 200, true, "User profile fetched successfully", { user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error });
    }
};

export const updateUserProfile = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const updatedUser = await UserService.updateUser(req.user!._id, req.body);
        if (!updatedUser) {
           res.status(404).json({ message: 'User not found' }); return ;
        }
        res.json(updatedUser);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Error updating user profile', error });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const deletedUser = await UserService.deleteUser(req.user!._id);
        if (!deletedUser) {
            res.status(404).json({ message: 'User not found' }); return ;
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Error deleting user', error });
    }
};