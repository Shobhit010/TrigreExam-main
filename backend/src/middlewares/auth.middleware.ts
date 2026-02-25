import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../modules/auth/auth.service';
import { AppError, asyncWrapper } from '../utils/errorHandler';

// Extend Express Request to carry the decoded JWT payload
export interface AuthRequest extends Request {
    user: JwtPayload;
}

export const requireAuth = asyncWrapper(
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        const header = req.headers['authorization'];
        if (!header?.startsWith('Bearer ')) {
            throw new AppError('Unauthorized — no token provided', 401);
        }
        const token = header.slice(7);
        const payload = await verifyToken(token);
        (req as AuthRequest).user = payload;
        next();
    }
);
