import { Request, Response } from 'express';
import { WishlistService } from '../services/wishlist.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from "../utils/logger";

export const getWishlist = async (req: AuthRequest, res: Response) => {
    try {
        const wishlist = await WishlistService.getWishlist(req.user!._id);
        res.json(wishlist);
    } catch (error) {
        logger.error(error)
        res.status(400).json({ error: 'Error fetching wishlist' });
    }
};

export const addToWishlist = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const { productId } = req.body;
        const wishlist = await WishlistService.addToWishlist(req.user!._id, productId);
        res.json(wishlist);
    } catch (error) {
        logger.error(error);
        res.status(400).json(error);
    }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const wishlist = await WishlistService.removeFromWishlist(req.user!._id, productId);
        res.json(wishlist);
    } catch (error) {
        logger.error(error);
        res.status(400).json(error);
    }
};

export const clearWishlist = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        await WishlistService.clearWishlist(req.user!._id);
        res.json({ message: 'Wishlist cleared successfully' });
    } catch (error) {
        logger.error(error)
        res.status(400).json( error);
    }
};

export const generateShareableLink = async (req: AuthRequest, res: Response) => {
    try {
        const shareableLink = await WishlistService.generateShareableLink(req.user!._id);
        res.json({ shareableLink });
    } catch (error) {
        logger.error(error);
        res.status(400).json(error);
    }
};

export const getSharedWishlist = async (req: Request, res: Response):Promise<void> => {
    try {
        const { shareableLink } = req.params;
        const wishlist = await WishlistService.getWishlistByShareableLink(shareableLink);
        if (!wishlist) {
             res.status(404).json({ error: 'Shared wishlist not found' }); return ;
        }
        res.json(wishlist);
    } catch (error) {
        logger.error(error);
        res.status(400).json({ error: 'Error fetching shared wishlist' });
    }
};

export const checkForDiscounts = async (req: AuthRequest, res: Response) => {
    try {
        const discountedItems = await WishlistService.checkForDiscounts(req.user!._id);
        res.json(discountedItems);
    } catch (error) {
        logger.error(error);
        res.status(400).json( error);
    }
};
