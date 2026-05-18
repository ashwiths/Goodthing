/**
 * sanitize.js
 * Lightweight request sanitization middleware.
 * Recursively strips keys starting with $ or . from req.body, req.query, and req.params
 * to block NoSQL query injection payloads.
 */
export const sanitizeRequest = (req, res, next) => {
  const sanitizeValue = (val) => {
    if (val && typeof val === 'object') {
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          if (key.startsWith('$') || key.startsWith('.')) {
            delete val[key];
          } else {
            sanitizeValue(val[key]);
          }
        }
      }
    }
  };

  if (req.body) sanitizeValue(req.body);
  if (req.query) sanitizeValue(req.query);
  if (req.params) sanitizeValue(req.params);

  next();
};
