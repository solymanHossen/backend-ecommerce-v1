import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { connectDatabase } from './config/database';
import { env } from './config';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from "./routes/review.routes";
import promotionRoutes from "./routes/promotion.routes";
import discountRoutes from "./routes/discount.routes";
import cartRoutes from "./routes/cart.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import checkoutRoutes from "./routes/checkout.routes";
import webhookRoutes from "./routes/webhook.routes";
import themeRoutes from "./routes/theme.routes";
import globalSettingRoutes from "./routes/global-setting.routes";
import { ThemeService } from "./services/theme.service";
import { errorHandler } from './middleware/error.middleware';
import logger from "./utils/logger";
import { authLimiter, apiLimiter } from './middleware/rateLimit.middleware';

const app = express();

// Middleware
// Secure CORS Configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin matches FRONTEND_URL
        const allowedOrigins = [env.FRONTEND_URL];
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies/headers if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(compression());

// Webhook route needs raw body for signature verification
app.use('/api/v1/webhook', express.raw({ type: 'application/json' }));
app.use('/api/v1/webhook', webhookRoutes);

// JSON parser for other routes
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Apply Rate Limits
// Apply strict limit to auth routes
app.use('/api/v1/auth', authLimiter);
// Apply general limit to all api routes
app.use('/api', apiLimiter);

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
app.use('/api/v1/settings', globalSettingRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Error handling middleware
app.use(errorHandler);

const initializeApp = async () => {
  try {
    await connectDatabase();
    await ThemeService.initializeDatabase();
    logger.info('Application initialized successfully');
    
    const PORT = env.PORT || 3000;
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Only automatically start if this file is the entry point
if (require.main === module) {
    initializeApp();
}

export default app;
