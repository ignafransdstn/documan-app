const { body, validationResult } = require('express-validator');

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\s_]).{8,}$/;

const signupValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('username is required')
    .matches(/^[^\s]+$/).withMessage('username must not contain spaces'),
  body('password')
    .notEmpty().withMessage('password is required')
    .matches(passwordRegex).withMessage('password must be at least 8 chars, include uppercase, number and special char (no spaces or _ )'),
  body('email')
    .notEmpty().withMessage('email is required')
    .isEmail().withMessage('invalid email'),
  body('userLevel')
    .optional()
    .isIn(['admin','level1','level2','level3']).withMessage('invalid userLevel'),
  body('name')
    .optional()
    .isString().withMessage('name must be a string')
];

// Register (admin) has same rules but username/email/password required
const registerValidation = signupValidation;

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

module.exports = {
  signupValidation,
  registerValidation,
  validateResult
};
