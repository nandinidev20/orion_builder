import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import { AuthenticationError } from '../utils/ApiError.js';
import Studio from '../model/Studio.js';

const auth = async (req, res, next) => {
  try {
    // Get token from header first, then fallback to query params
    let token = req.header('Authorization');

    if (!token) {
      token = req.query.token;
    }

    // Check if token exists
    if (!token) {
      return next(new AuthenticationError('Access denied. No token provided.'));
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trim();
    }

    if (!token) {
      return next(new AuthenticationError('Access denied. Invalid token format.'));
    }
    console.log(token);
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    console.log(decoded);
    // Find user by ID from token payload
    // First check if decoded has userId, otherwise check for studioId
    let user;
    if (decoded.userId) {
      user = await User.findById(decoded.userId).select('-password');
      console.log(user);
    } else if (decoded.studioId) {
      console.log(decoded.studioId);
      user = await User.findOne({ studio: decoded.studioId }).select('-password');
      console.log(user);
    } else {
      return next(new AuthenticationError('Invalid token: no user ID or studio ID found.'));
    }

    if (!user) {
      return next(new AuthenticationError('User not found.'));
    }

    // Check if user is suspended
    if (user.isActive === false) {
      return next(new AuthenticationError('User account is suspended.'));
    }

    // If user has a studio, check if the studio is suspended
    if (user.studio) {
      const studio = await Studio.findById(user.studio);
      if (studio && studio.isSuspended) {
        return next(new AuthenticationError('Studio account is suspended.'));
      }
    }

    // Attach user to request object
    req.user = user;
    
    // Also set studioId for convenience in studio routes
    if (user.studio) {
      req.studioId = user.studio;
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token.'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expired.'));
    }

    next(error);
  }
};

// Middleware to check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Access denied. User not authenticated.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AuthenticationError('Access denied. Insufficient permissions.'));
    }

    next();
  };
};

export { auth, authorize };
