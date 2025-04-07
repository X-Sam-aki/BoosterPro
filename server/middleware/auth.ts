import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { storage } from '../storage';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Get or create user in our database
    let user = await storage.getUserByFirebaseId(decodedToken.uid);
    if (!user) {
      user = await storage.createUser({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        avatarUrl: decodedToken.picture,
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // Replace 'any' with your User type
    }
  }
} 