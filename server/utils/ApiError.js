class ApiError extends Error {
  constructor(message, statusCode, type = 'GenericError') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = true; // Distinguish operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(message, errors = []) {
    super(message, 400, 'ValidationError');
    this.errors = errors;
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AuthenticationError');
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AuthorizationError');
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NotFoundError');
  }
}

class DatabaseError extends ApiError {
  constructor(message = 'Database error occurred') {
    super(message, 500, 'DatabaseError');
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflict occurred') {
    super(message, 409, 'ConflictError');
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RateLimitError');
  }
}

export {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ConflictError,
  RateLimitError
};
