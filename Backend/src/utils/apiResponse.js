/**
 * successResponse — Standard success envelope
 */
export const successResponse = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * errorResponse — Standard error envelope
 */
export const errorResponse = (res, message = "An error occurred", statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: { message, ...(details && { details }) },
  });
};

/**
 * AppError — Operational error class for known, expected errors.
 * Extend Error and mark as operational so the global handler can respond cleanly.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
