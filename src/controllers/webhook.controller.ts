import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { env } from '../config';
import { CheckoutService } from '../services/checkout.service';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

export const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('Missing Stripe signature in webhook request');
    return next(new AppError('Missing Stripe signature', 400));
  }

  let event: Stripe.Event;

  try {
    // req.body must be the raw buffer here
    // Verify that req.body is indeed a buffer (debugging/safety)
    if (!Buffer.isBuffer(req.body)) {
         logger.error('Webhook received non-buffer body. Middleware configuration error.');
         // Try to handle if it's already parsed string/object (unlikely to work for signature)
         // But for now fail if not Buffer
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return next(new AppError(`Webhook Error: ${err.message}`, 400));
  }

  // Handle the event
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await CheckoutService.handleStripeWebhook(session);
      logger.info(`Stripe webhook processed for session: ${session.id}`);
    } else {
        logger.info(`Unhandled Stripe webhook event type: ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook event', error);
    next(error);
  }
};
