import { errorResponse } from "../utils/apiResponse.js";

/**
 * Generic Zod validation middleware for request bodies.
 * @param {import("zod").ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const firstIssue = result.error.issues?.[0];
    const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation failed";
    return errorResponse(res, message, 400);
  }
  req.body = result.data;
  next();
};

export default validate;
