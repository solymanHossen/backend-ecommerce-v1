import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../constants/roles';
import { AppError } from '../utils/AppError';
import { User } from '../models/user.model';

export interface UserPayload {
    _id: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: UserPayload;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new AppError('No token provided', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {id: string, role: string};
        
        req.user = {
            _id: decoded.id,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        next(new AppError('Please authenticate.', 401));
    }
};

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || req.user.role !== UserRole.ADMIN) {
             throw new AppError('Access denied. Admin rights required.', 403);
        }

        // SECURITY FIX: Verify admin status from DB to handle banned/demoted admins immediately
        const user = await User.findById(req.user._id);
        if (!user || user.role !== UserRole.ADMIN) {
            throw new AppError('Access denied. Admin privileges revoked.', 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const vendorMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || (req.user.role !== UserRole.VENDOR && req.user.role !== UserRole.ADMIN)) {
             throw new AppError('Access denied. Vendor rights required.', 403);
        }
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to validate resource ownership
 * Used to prevent IDOR attacks on user-specific resources
 */
export const requireOwnership = (resourceGetter: (req: AuthRequest) => Promise<{ userId: string } | null>) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const resource = await resourceGetter(req);
            
            if (!resource) {
                return next(new AppError('Resource not found', 404));
            }
            
            // Admin can access any resource
            if (req.user?.role === UserRole.ADMIN) {
                return next();
            }
            
            // Check ownership
            if (resource.userId !== req.user!._id.toString()) {
                return next(new AppError('Access denied. You do not own this resource.', 403));
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
};
