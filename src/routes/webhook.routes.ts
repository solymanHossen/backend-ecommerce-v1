import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/webhook.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Route: POST /api/v1/webhook
// Description: Handle Stripe webhooks
// Access: Public (Stripe only)
// Note regarding middleware: 
// 1. No auth middleware needed (signature verification handles security)
// 2. Requires raw body for signature verification (handled in app.ts)

router.post(
  '/', 
  asyncHandler(handleStripeWebhook)
);

export default router;
