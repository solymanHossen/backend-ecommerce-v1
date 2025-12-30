import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getCart,addToCart,removeFromCart,updateCartItemQuantity,clearCart} from '../controllers/cart.controller';
import { validateAddToCart, validateUpdateCartItem } from '../validators/cart.validator';

const router = express.Router();

router.get('/', authMiddleware, getCart);
router.post('/add', authMiddleware, validateAddToCart, addToCart);
router.delete('/remove/:cartItemId', authMiddleware, removeFromCart);
router.put('/update/:cartItemId', authMiddleware, validateUpdateCartItem, updateCartItemQuantity);
router.delete('/clear', authMiddleware, clearCart);

export default router;