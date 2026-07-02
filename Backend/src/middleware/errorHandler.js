import { AppError } from "../utils/apiResponse.js";

/**
 * Global Express error handling middleware.
 * Catches all errors forwarded via next(error).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log full error in development
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error:", err);
  }

  // Known operational error
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Prisma known errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: { message: "A record with this value already exists." },
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: { message: "Record not found." },
    });
  }

  // Unexpected errors — don't leak internals in production
  const message =
    process.env.NODE_ENV === "production"
      ? "An internal server error occurred"
      : err.message;

  return res.status(500).json({
    success: false,
    error: { message },
  });
};

export default errorHandler;
