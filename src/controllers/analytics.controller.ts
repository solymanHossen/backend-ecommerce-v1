import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import sendResponse from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../utils/AppError';
import { storeService } from '../services/store.service';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';

export const getVendorAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    // 1. Get Vendor Store
    const store = await storeService.getStoreByOwner(req.user!._id);
    if (!store) {
        throw new AppError("Store not found", 404);
    }

    // 2. Fetch Metrics
    const pendingOrdersCount = await Order.countDocuments({ 
        store: store._id, 
        status: 'pending' 
    });

    const productsCount = await Product.countDocuments({ 
        store: store._id 
    });

    const completedOrdersCount = await Order.countDocuments({
        store: store._id,
        status: { $in: ['shipped', 'delivered'] }
    });

    // 3. Return Analytics Data
    sendResponse(res, 200, true, "Vendor analytics retrieved successfully", {
        totalEarnings: store.balance,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        totalProducts: productsCount,
        currency: 'USD'
    });
});
