/**
 * asyncWrapper — Eliminates try/catch boilerplate in Express controllers.
 * Wraps an async function and passes errors to Express's next() handler.
 *
 * Usage:
 *   export const myController = asyncWrapper(async (req, res) => { ... });
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncWrapper;
