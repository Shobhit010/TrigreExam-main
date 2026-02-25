import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import {
  loginWithRuppi,
  registerWithRuppi,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithRuppi,
  resendVerificationCode,
  verifyStudentOtp,
  changePassword,
  getProfileWithRuppi,
  updateProfileWithRuppi,
} from './auth.service';
import { sendSuccess, sendError } from '../../utils/responseHandler';
import { asyncWrapper } from '../../utils/errorHandler';

// AUTH-001 — Login
export const loginController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }

    const { username, password } = req.body as { username: string; password: string };

    const result = await loginWithRuppi(username, password);

    sendSuccess(
      res,
      { token: result.token, user: result.user },
      'Login successful',
      200
    );
  }
);

// AUTH-002 — Register
export const registerController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }

    const { firstname, lastname, mobile, email, password, confirm_password, country } =
      req.body as {
        firstname: string;
        lastname: string;
        mobile: string;
        email: string;
        password: string;
        confirm_password: string;
        country?: string;
      };

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const profilePic = file
      ? { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname }
      : undefined;

    const result = await registerWithRuppi(
      firstname,
      lastname,
      mobile,
      email,
      password,
      confirm_password,
      country ?? 'IN',
      profilePic
    );

    sendSuccess(res, result, 'Registration successful. Please verify your email.', 201);
  }
);

// AUTH-003 — Forgot Password (Send OTP)
export const forgotPasswordController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }

    const { mobile } = req.body as { mobile: string };
    await sendForgotPasswordOtp(mobile);
    sendSuccess(res, null, 'OTP sent to your registered mobile number', 200);
  }
);

// AUTH-004 — Verify OTP
export const verifyOtpController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }

    const { mobile, otp } = req.body as { mobile: string; otp: string };
    await verifyForgotPasswordOtp(mobile, otp);
    sendSuccess(res, null, 'OTP verified successfully', 200);
  }
);

// AUTH-005 — Reset Password
export const resetPasswordController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }

    const { mobile, password, confirm_password } = req.body as {
      mobile: string;
      password: string;
      confirm_password: string;
    };
    await resetPasswordWithRuppi(mobile, password, confirm_password);
    sendSuccess(res, null, 'Password changed successfully', 200);
  }
);

// AUTH-006 — Resend Verification Code
export const resendCodeController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }

    const { student_id } = req.body as { student_id: string };
    await resendVerificationCode(student_id);
    sendSuccess(res, null, 'Verification email sent', 200);
  }
);

// AUTH-007 — Verify Student OTP (signup email OTP verification)
export const verifyStudentController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }

    const { student_id, code } = req.body as { student_id: string; code: string };
    await verifyStudentOtp(student_id, code);
    sendSuccess(res, null, 'Email verified successfully', 200);
  }
);

// AUTH-008 — Change Password (authenticated)
export const changePasswordController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }

    const { student_id } = (req as import('../../middlewares/auth.middleware').AuthRequest).user;
    const { old_password, new_password, confirm_password } = req.body as {
      old_password: string;
      new_password: string;
      confirm_password: string;
    };

    await changePassword(student_id, old_password, new_password, confirm_password);
    sendSuccess(res, null, 'Password changed successfully', 200);
  }
);

// PROFILE — Get Profile
export const getProfileController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { student_id } = (req as import('../../middlewares/auth.middleware').AuthRequest).user;
    const user = await getProfileWithRuppi(student_id);
    sendSuccess(res, user, 'Profile fetched successfully', 200);
  }
);

// PROFILE — Update Profile
export const updateProfileController = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { student_id } = (req as import('../../middlewares/auth.middleware').AuthRequest).user;
    const updateData = req.body as {
      firstname?: string;
      lastname?: string;
      mobile?: string;
      email?: string;
      class?: string;
      segment?: string;
      address?: string;
    };

    console.log('[AuthController] Update Profile request for:', student_id);
    console.log('[AuthController] Body keys:', Object.keys(req.body));
    console.log('[AuthController] File:', (req as any).file ? (req as any).file.originalname : 'None');

    // Extract uploaded profile picture file (if any) — multer puts it on req.file
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const profilePicFile = file
      ? { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname }
      : undefined;

    await updateProfileWithRuppi(student_id, updateData, profilePicFile);
    sendSuccess(res, null, 'Profile updated successfully', 200);
  }
);

