// Authentication middleware
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    publicKey: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // TODO: Implement proper JWT token verification
    // For now, we'll just check if token is present
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }
    
    // TODO: Verify token and extract user info
    req.user = {
      publicKey: 'placeholder_public_key'
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Check if user has admin privileges
    const isAdmin = true; // Placeholder
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(403).json({ error: 'Authorization failed' });
  }
}; 