import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import {
  loginController,
  registerController,
  forgotPasswordController,
  verifyOtpController,
  resetPasswordController,
  resendCodeController,
  verifyStudentController,
  changePasswordController,
  getProfileController,
  updateProfileController,
} from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

// ---- Rate limiters -------------------------------------------------------

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased from 20 to 100 to allow frequent updates during development
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---- Multer (profile_pic upload for register) ----------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile picture'));
    }
  },
});

// ---- Validation rules ----------------------------------------------------

const loginValidation = [
  body('username')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters'),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 4, max: 128 })
    .withMessage('Password must be between 4 and 128 characters'),
];

const registerValidation = [
  body('firstname').isString().trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastname').isString().trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('mobile').isString().trim().notEmpty().withMessage('Mobile number is required').isLength({ min: 7, max: 15 }),
  body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('password').isString().isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters'),
  body('confirm_password').isString().notEmpty().withMessage('Confirm password is required'),
  body('country').optional().isString().trim().isLength({ max: 10 }),
];

const forgotPasswordValidation = [
  body('mobile').isString().trim().notEmpty().withMessage('Mobile number is required').isLength({ min: 7, max: 15 }),
];

const verifyOtpValidation = [
  body('mobile').isString().trim().notEmpty().withMessage('Mobile number is required'),
  body('otp').isString().trim().notEmpty().withMessage('OTP is required').isLength({ min: 4, max: 8 }),
];

const resetPasswordValidation = [
  body('mobile').isString().trim().notEmpty().withMessage('Mobile number is required'),
  body('password').isString().isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters'),
  body('confirm_password').isString().notEmpty().withMessage('Confirm password is required'),
];

const resendCodeValidation = [
  body('student_id').isString().trim().notEmpty().withMessage('Student ID is required'),
];

const verifyStudentValidation = [
  body('student_id').isString().trim().notEmpty().withMessage('Student ID is required'),
  body('code').isString().trim().notEmpty().withMessage('Verification code is required').isLength({ min: 4, max: 8 }),
];

// ---- Routes --------------------------------------------------------------

// POST /api/auth/login
router.post('/login', loginRateLimiter, loginValidation, loginController);

// POST /api/auth/register
router.post('/register', generalRateLimiter, upload.single('profile_pic'), registerValidation, registerController);

// POST /api/auth/forgot-password
router.post('/forgot-password', generalRateLimiter, forgotPasswordValidation, forgotPasswordController);

// POST /api/auth/verify-otp
router.post('/verify-otp', generalRateLimiter, verifyOtpValidation, verifyOtpController);

// POST /api/auth/reset-password
router.post('/reset-password', generalRateLimiter, resetPasswordValidation, resetPasswordController);

// POST /api/auth/resend-code
router.post('/resend-code', generalRateLimiter, resendCodeValidation, resendCodeController);

// POST /api/auth/verify-student
router.post('/verify-student', generalRateLimiter, verifyStudentValidation, verifyStudentController);

// POST /api/auth/change-password  (requires JWT)
const changePasswordValidation = [
  body('old_password').isString().notEmpty().withMessage('Old password is required').isLength({ min: 4, max: 128 }),
  body('new_password').isString().isLength({ min: 6, max: 128 }).withMessage('New password must be at least 6 characters'),
  body('confirm_password').isString().notEmpty().withMessage('Confirm password is required'),
];
router.post('/change-password', requireAuth, generalRateLimiter, changePasswordValidation, changePasswordController);

// GET /api/auth/profile
router.get('/profile', requireAuth, generalRateLimiter, getProfileController);

// POST /api/auth/update-profile
router.post('/update-profile', requireAuth, generalRateLimiter, upload.single('profile_pic'), updateProfileController);


export default router;
