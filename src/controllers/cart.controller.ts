import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from "../utils/logger";

export const getCart = async (req: AuthRequest, res: Response) => {
    try {
        const cart = await CartService.getCart(req.user!._id);
        res.json(cart);
    } catch (error) {
        logger.error('getCart', error);
        res.status(400).json({ error: 'Error fetching cart' });
    }
};

export const addToCart = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const { productId, quantity } = req.body;
        const cart = await CartService.addToCart(req.user!._id, productId, quantity);
        res.json(cart);
    } catch (error:any) {
        logger.error(error);
        res.status(400).json({ error: error.message });
    }
};

export const removeFromCart = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const cart = await CartService.removeFromCart(req.user!._id, req.params.cartItemId);
        res.json(cart);
    } catch (error) {
        logger.error('removeFromCart', error);
        res.status(400).json({ error});
    }
};

export const updateCartItemQuantity = async (req: AuthRequest, res: Response) => {
    try {
        const { quantity } = req.body;
        const cart = await CartService.updateCartItemQuantity(req.user!._id, req.params.cartItemId, quantity);
        res.json(cart);
    } catch (error:any) {
        res.status(400).json({ error: error.message });
    }
};

export const clearCart = async (req: AuthRequest, res: Response) => {
    try {
        await CartService.clearCart(req.user!._id);
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        logger.error(error);
        res.status(400).json( error );
    }
};
