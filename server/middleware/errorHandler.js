import { loggerInstance } from './logger.js';
import {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ConflictError,
  RateLimitError
} from '../utils/ApiError.js';

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  loggerInstance.error('Error occurred', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress
  });

  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError(message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered for ${field}`;
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  // Handle JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AuthenticationError(message);
  }

  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = err.message || 'File upload error';
    error = new ValidationError(message);
  }

  // Handle specific custom errors
  if (err instanceof ApiError) {
    // Custom API errors are already properly formatted
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        type: err.type,
        ...(err.errors && { details: err.errors }) // Include validation errors if present
      },
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Default error response for unknown errors
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      type: 'ServerError',
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    },
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Not found handler middleware
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

export { errorHandler, notFoundHandler };
