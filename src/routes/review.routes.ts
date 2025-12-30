import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createReview,getReviewsByProduct,updateReview,deleteReview } from '../controllers/review.controller';
import { validateCreateReview, validateUpdateReview } from '../validators/review.validator';
const router = express.Router();

router.post('/products/:productId/reviews', authMiddleware, validateCreateReview, createReview);
router.get('/products/:productId/reviews', getReviewsByProduct);
router.put('/reviews/:reviewId', authMiddleware, validateUpdateReview, updateReview);
router.delete('/reviews/:reviewId', authMiddleware, deleteReview);

export default router;