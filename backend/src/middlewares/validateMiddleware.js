const AppError = require('../utils/AppError');

function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', formattedErrors));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = {
  validateBody,
};
