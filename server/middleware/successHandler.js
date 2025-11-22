import { loggerInstance } from './logger.js';

// Success response handler
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  // Log the successful response
 loggerInstance.info('Success response sent', {
    statusCode,
    message,
    data: data ? Object.keys(data) : null
  });

  return res.status(statusCode).json(response);
};

// Success handler middleware
const successHandler = (req, res, next) => {
 // Add success response methods to res object
  res.success = (data = null, message = 'Success', statusCode = 200) => {
    return successResponse(res, data, message, statusCode);
  };

  // Specific success methods for common status codes
  res.created = (data = null, message = 'Resource created successfully') => {
    return successResponse(res, data, message, 201);
  };

  res.accepted = (data = null, message = 'Request accepted') => {
    return successResponse(res, data, message, 202);
  };

  res.noContent = (message = 'Operation completed successfully') => {
    const response = {
      success: true,
      message,
      data: null,
      timestamp: new Date().toISOString()
    };

    loggerInstance.info('No content response sent', {
      statusCode: 204,
      message
    });

    return res.status(204).json(response);
  };

  next();
};

// Export the success handler middleware
export default successHandler;

// Export the success response function for direct use
export { successResponse };
