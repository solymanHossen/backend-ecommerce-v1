import { config } from 'dotenv';
config(); // Load environment variables

if (!process.env.JWT_REFRESH_SECRET) {
  console.warn("Warning: JWT_REFRESH_SECRET is not defined in environment variables.");
}

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import winston from 'winston';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import { errorHandler } from './middleware/error.middleware';
import logger from "./utils/logger";
import reviewRoutes from "./routes/review.routes";
import promotionRoutes from "./routes/promotion.routes";
import discountRoutes from "./routes/discount.routes";
import cartRoutes from "./routes/cart.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import checkoutRoutes from "./routes/checkout.routes";
import themeRoutes from "./routes/theme.routes";
import { ThemeService } from "./services/theme.service";


const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB and initialize theme database
const initializeApp = async () => {
  try {
    await connectDatabase();
    await ThemeService.initializeDatabase();
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/discounts', discountRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/themes', themeRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);

});

export default app;