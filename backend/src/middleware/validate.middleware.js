const { validationResult } = require('express-validator');
const { errorResponse }    = require('../utils/apiResponse');

/**
 * Reads express-validator results and short-circuits with 422 if any fail.
 * Place after your validator chain in any route:
 *
 *   router.post('/register', [
 *     body('email').isEmail(),
 *     body('password').isLength({ min: 6 }),
 *     validate,          ← this
 *   ], register);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array()[0].msg; // return first error only — clean UX
    return errorResponse(res, message, 422);
  }
  next();
};

module.exports = { validate };