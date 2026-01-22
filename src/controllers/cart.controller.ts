import { Response } from 'express';
import { CartService } from '../services/cart.service';
import { AuthRequest } from '../middleware/auth.middleware';
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await CartService.getCart(req.user!._id);
    sendResponse(res, 200, true, "Cart fetched successfully", cart);
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, quantity } = req.body;
    const cart = await CartService.addToCart(req.user!._id, productId, quantity);
    sendResponse(res, 200, true, "Item added to cart", cart);
});

export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await CartService.removeFromCart(req.user!._id, req.params.cartItemId);
    sendResponse(res, 200, true, "Item removed from cart", cart);
});

export const updateCartItemQuantity = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { quantity } = req.body;
    const cart = await CartService.updateCartItemQuantity(req.user!._id, req.params.cartItemId, quantity);
    sendResponse(res, 200, true, "Cart item quantity updated", cart);
});

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    await CartService.clearCart(req.user!._id);
    sendResponse(res, 200, true, "Cart cleared successfully");
});
