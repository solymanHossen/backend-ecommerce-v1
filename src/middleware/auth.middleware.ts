import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../constants/roles';
import { AppError } from '../utils/AppError';

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

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
        return next(new AppError('Access denied. Admin rights required.', 403));
    }
    next();
};
