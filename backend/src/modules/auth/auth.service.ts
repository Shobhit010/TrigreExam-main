import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import FormData from 'form-data';
import { UserModel, type IUser } from './auth.schema';
import { ruppiClient } from '../../utils/apiClient';
import { ruppiConfig } from '../../config/ruppi.config';
import { AppError } from '../../utils/errorHandler';
import { env } from '../../config/env';

// ---- AES-256-GCM encryption for RUPPI token storage -------------------
// GCM provides both confidentiality AND authenticated integrity.
// Key is derived from JWT_SECRET via SHA-256 to guarantee exactly 32 bytes.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(env.jwtSecret).digest();
}

function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all hex-encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

// Exported for future use by endpoints that need to call RUPPI on behalf of a user
export function decryptToken(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) {
    throw new AppError('Stored token format is invalid', 500, false);
  }
  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// ---- RUPPI API response type -------------------------------------------
interface RuppiLoginResponse {
  status: boolean;
  status_code: number;
  data: {
    firstname: string;
    mobile: string;
    email: string;
    student_id: string;
    profile_pic: string | null;
  };
  token: string;
  verified: boolean;
  msg: string;
}

// ---- JWT payload stored in the backend's token -------------------------
export interface JwtPayload {
  sub: string;
  student_id: string;
  email: string;
  firstname: string;
  mobile: string;
  profile_pic: string | null;
  iat?: number;
  exp?: number;
}

// ---- Shape returned to the frontend ------------------------------------
export interface AuthenticatedUser {
  id: string;
  student_id: string;
  email: string;
  name: string;
  mobile: string;
  profile_pic: string | null;
}

export interface LoginResult {
  token: string;
  user: AuthenticatedUser;
}

// ---- Core login function -----------------------------------------------
export async function loginWithRuppi(
  username: string,
  password: string
): Promise<LoginResult> {
  // Step 1: Call RUPPI external API
  let ruppiResponse: RuppiLoginResponse;

  console.log(`[AuthService] Login → POST ${ruppiConfig.loginUrl} | username: "${username}"`);
  try {
    const response = await ruppiClient.post<RuppiLoginResponse>(
      ruppiConfig.loginUrl,
      {
        username,
        password,
        deviceType: ruppiConfig.deviceType,
      }
    );
    ruppiResponse = response.data;
    console.log('[AuthService] RUPPI login response:', JSON.stringify(ruppiResponse));
  } catch (error: unknown) {
    // Handle known RUPPI HTTP error codes
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response !== null &&
      typeof error.response === 'object' &&
      'status' in error.response
    ) {
      const axiosErr = error as { response: { status: number; data?: { msg?: string } } };
      console.error('[AuthService] RUPPI login rejected — HTTP', axiosErr.response.status, '| body:', JSON.stringify(axiosErr.response.data));
      if (axiosErr.response.status === 401 || axiosErr.response.status === 400) {
        throw new AppError('Invalid credentials', 401);
      }
    }
    console.error('[AuthService] RUPPI API unreachable:', error);
    throw new AppError('Authentication service is temporarily unavailable', 503);
  }

  // Step 2: Validate RUPPI response
  if (!ruppiResponse.status || !ruppiResponse.token || !ruppiResponse.data?.student_id) {
    console.error('[AuthService] RUPPI returned unexpected shape:', ruppiResponse.msg);
    throw new AppError(ruppiResponse.msg ?? 'Login failed', 401);
  }

  const { data: ruppiUser, token: ruppiToken } = ruppiResponse;

  // Step 3: Encrypt RUPPI token before storing — never persisted in plaintext
  const encryptedRuppiToken = encryptToken(ruppiToken);

  // Step 4: Upsert user in MongoDB (create on first login, update on subsequent)
  const now = new Date();
  const user = await UserModel.findOneAndUpdate(
    { student_id: ruppiUser.student_id },
    {
      $set: {
        email: ruppiUser.email ?? '',
        mobile: ruppiUser.mobile,
        firstname: ruppiUser.firstname,
        profile_pic: ruppiUser.profile_pic ?? null,
        ruppi_token_encrypted: encryptedRuppiToken,
        last_login: now,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ) as IUser;

  // Step 5: Issue backend's own JWT — payload contains NO sensitive RUPPI data
  const jwtPayload: JwtPayload = {
    sub: (user._id as mongoose.Types.ObjectId).toString(),
    student_id: user.student_id,
    email: user.email,
    firstname: user.firstname,
    mobile: user.mobile,
    profile_pic: user.profile_pic,
  };

  const token = jwt.sign(jwtPayload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'trigreexam-backend',
    audience: 'trigreexam-frontend',
  });

  // Step 6: Return sanitized response — RUPPI token never leaves the backend
  const authenticatedUser: AuthenticatedUser = {
    id: jwtPayload.sub,
    student_id: user.student_id,
    email: user.email,
    name: user.firstname,
    mobile: user.mobile,
    profile_pic: user.profile_pic,
  };

  return { token, user: authenticatedUser };
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      issuer: 'trigreexam-backend',
      audience: 'trigreexam-frontend',
    }) as JwtPayload;
    return payload;
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}

// Retrieve the decrypted RUPPI token for server-side RUPPI API calls
export async function getRuppiToken(studentId: string): Promise<string> {
  const user = await UserModel.findOne({ student_id: studentId })
    .select('+ruppi_token_encrypted')
    .lean() as (IUser & { ruppi_token_encrypted: string }) | null;

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return decryptToken(user.ruppi_token_encrypted);
}

// ============================================================
// AUTH-002 — Register
// ============================================================

interface RuppiRegisterResponse {
  status: boolean;
  status_code: number;
  data: { id: string };
  msg: string;
  profile_pic: string;
  otp_verification: string;
}

export interface RegisterResult {
  student_id: string;
  requires_verification: boolean;
  message: string;
}

export async function registerWithRuppi(
  firstname: string,
  lastname: string,
  mobile: string,
  email: string,
  password: string,
  confirm_password: string,
  country: string,
  profilePicFile?: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<RegisterResult> {
  const fd = new FormData();
  fd.append('firstname', firstname);
  fd.append('lastname', lastname);
  fd.append('mobile', mobile);
  fd.append('email', email);
  fd.append('password', password);
  fd.append('confirm_password', confirm_password);
  fd.append('country', country);
  if (profilePicFile) {
    fd.append('profile_pic', profilePicFile.buffer, {
      filename: profilePicFile.originalname,
      contentType: profilePicFile.mimetype,
    });
  }

  let ruppiData: RuppiRegisterResponse;
  try {
    const { data } = await ruppiClient.post<RuppiRegisterResponse>(
      ruppiConfig.registerUrl,
      fd,
      { headers: fd.getHeaders() }
    );
    ruppiData = data;
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response !== null &&
      typeof error.response === 'object' &&
      'status' in error.response
    ) {
      const axiosErr = error as { response: { status: number; data?: { msg?: string } } };
      const msg = axiosErr.response.data?.msg ?? 'Registration failed';
      if (axiosErr.response.status === 400 || axiosErr.response.status === 422) {
        throw new AppError(msg, 400);
      }
    }
    console.error('[AuthService] RUPPI Register error:', error);
    throw new AppError('Registration service is temporarily unavailable', 503);
  }

  if (!ruppiData.status) {
    throw new AppError(ruppiData.msg ?? 'Registration failed', 400);
  }

  return {
    student_id: ruppiData.data.id,
    requires_verification: ruppiData.otp_verification === 'yes',
    message: ruppiData.msg,
  };
}

// ============================================================
// AUTH-003 — Forgot Password (Send OTP)
// ============================================================

interface RuppiForgotPasswordResponse {
  status: boolean;
  msg: string;
  cause?: string;
  status_code?: number;
}

export async function sendForgotPasswordOtp(mobile: string): Promise<void> {
  // RUPPI forgot-password endpoint requires x-www-form-urlencoded (not JSON)
  const url = ruppiConfig.forgotPasswordUrl;

  // Build payload — include dlt_te_id if configured (required for SMS delivery in India)
  const params: Record<string, string> = { mobile };
  if (env.ruppiOtpDltTeId) {
    params['dlt_te_id'] = env.ruppiOtpDltTeId;
  }
  const formBody = new URLSearchParams(params);

  console.log('[AuthService] sendForgotPasswordOtp → POST', url);
  console.log('[AuthService] Payload:', JSON.stringify(params));
  console.log('[AuthService] DLT template ID:', env.ruppiOtpDltTeId ?? 'NOT SET — OTP may be silently blocked by Indian carriers');

  let ruppiData: RuppiForgotPasswordResponse;
  try {
    const { data } = await ruppiClient.post<RuppiForgotPasswordResponse>(
      url,
      formBody.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    ruppiData = data;
    console.log('[AuthService] RUPPI forgot-password response:', JSON.stringify(ruppiData));
  } catch (error: unknown) {
    // Log the full error shape so we can diagnose during development
    console.error('[AuthService] RUPPI forgot-password raw error:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)));

    // Case 1: RUPPI responded with a non-2xx HTTP status
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response: unknown }).response !== null
    ) {
      const axiosErr = error as {
        response: {
          status: number;
          data?: { msg?: string; message?: string };
        };
      };
      const msg =
        axiosErr.response.data?.msg ??
        axiosErr.response.data?.message ??
        'Could not send OTP';
      console.error('[AuthService] RUPPI HTTP error status:', axiosErr.response.status, '| msg:', msg);
      const isNotRegistered =
        msg.toLowerCase().includes('not register') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('does not exist');
      throw new AppError(msg, isNotRegistered ? 404 : 400);
    }

    // Case 2: Request was made but no response received (network timeout/DNS)
    if (error !== null && typeof error === 'object' && 'request' in error) {
      console.error('[AuthService] RUPPI no response received (network error)');
      throw new AppError('OTP service is temporarily unavailable. Please try again.', 503);
    }

    // Case 3: Axios config / setup error
    console.error('[AuthService] Unexpected error calling RUPPI forgot-password:', error);
    throw new AppError('OTP service is temporarily unavailable. Please try again.', 503);
  }

  if (!ruppiData.status) {
    // RUPPI returns HTTP 200 with status:false when the mobile is not registered.
    const msg = ruppiData.msg ?? 'Could not send OTP';
    const isNotRegistered =
      msg.toLowerCase().includes('not register') ||
      msg.toLowerCase().includes('not found') ||
      msg.toLowerCase().includes('does not exist');
    console.warn('[AuthService] RUPPI status:false —', msg);
    throw new AppError(msg, isNotRegistered ? 404 : 400);
  }
}


// ============================================================
// AUTH-004 — Verify OTP
// ============================================================

interface RuppiVerifyOtpResponse {
  status: boolean;
  msg: string;
  cause?: string;
  error?: Record<string, string>;
  status_code?: number;
}

export async function verifyForgotPasswordOtp(mobile: string, otp: string): Promise<void> {
  // RUPPI verify-otp endpoint is a GET request with query params
  const url = ruppiConfig.verifyOtpUrl;
  console.log('[AuthService] verifyForgotPasswordOtp → GET', url, '| mobile:', mobile, '| otp:', otp);

  let ruppiData: RuppiVerifyOtpResponse;
  try {
    const formBody = new URLSearchParams({ mobile, otp });
    const { data } = await ruppiClient.post<RuppiVerifyOtpResponse>(
      url,
      formBody.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    ruppiData = data;
    console.log('[AuthService] RUPPI verify-otp response:', JSON.stringify(ruppiData));
  } catch (error: unknown) {
    console.error('[AuthService] RUPPI verify-otp raw error:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response !== null &&
      typeof error.response === 'object' &&
      'status' in error.response
    ) {
      const axiosErr = error as { response: { status: number; data?: { msg?: string } } };
      const msg = axiosErr.response.data?.msg ?? 'OTP verification failed';
      throw new AppError(msg, 400);
    }
    console.error('[AuthService] RUPPI Verify OTP error:', error);
    throw new AppError('OTP service is temporarily unavailable', 503);
  }

  if (!ruppiData.status) {
    console.warn('[AuthService] RUPPI verify-otp status:false —', ruppiData.msg);
    throw new AppError(ruppiData.msg ?? 'Invalid OTP', 400);
  }

  console.log('[AuthService] OTP verified successfully for', mobile);
}



// ============================================================
// AUTH-005 — Reset Password
// ============================================================

interface RuppiResetPasswordResponse {
  status: boolean;
  msg: string;
}

export async function resetPasswordWithRuppi(
  mobile: string,
  password: string,
  confirm_password: string
): Promise<void> {
  const formBody = new URLSearchParams({ mobile, password, confirm_password });

  let ruppiData: RuppiResetPasswordResponse;
  try {
    const { data } = await ruppiClient.post<RuppiResetPasswordResponse>(
      ruppiConfig.resetPasswordUrl,
      formBody.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    ruppiData = data;
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response !== null &&
      typeof error.response === 'object' &&
      'status' in error.response
    ) {
      const axiosErr = error as { response: { status: number; data?: { msg?: string } } };
      const msg = axiosErr.response.data?.msg ?? 'Password reset failed';
      throw new AppError(msg, 400);
    }
    console.error('[AuthService] RUPPI Reset Password error:', error);
    throw new AppError('Password reset service is temporarily unavailable', 503);
  }

  if (!ruppiData.status) {
    throw new AppError(ruppiData.msg ?? 'Password reset failed', 400);
  }
}

// ============================================================
// AUTH-006 — Resend Verification Code
// ============================================================

interface RuppiResendCodeResponse {
  status: boolean;
  msg: string;
}

export async function resendVerificationCode(studentId: string): Promise<void> {
  let ruppiData: RuppiResendCodeResponse;
  try {
    const { data } = await ruppiClient.post<RuppiResendCodeResponse>(
      ruppiConfig.resendCodeUrl,
      { student_id: studentId }
    );
    ruppiData = data;
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response !== null &&
      typeof error.response === 'object' &&
      'status' in error.response
    ) {
      const axiosErr = error as { response: { status: number; data?: { msg?: string } } };
      const msg = axiosErr.response.data?.msg ?? 'Could not resend code';
      if (axiosErr.response.status === 404) {
        throw new AppError('Student not found', 404);
      }
      throw new AppError(msg, 400);
    }
    console.error('[AuthService] RUPPI Resend Code error:', error);
    throw new AppError('Resend code service is temporarily unavailable', 503);
  }

  if (!ruppiData.status) {
    throw new AppError(ruppiData.msg ?? 'Could not resend verification code', 400);
  }
}

// ============================================================
// AUTH-007 — Verify Student OTP (signup email OTP verification)
// ============================================================

interface RuppiVerifyStudentResponse {
  status: boolean;
  msg: string;
}

export async function verifyStudentOtp(studentId: string, code: string): Promise<void> {
  let ruppiData: RuppiVerifyStudentResponse;
  try {
    const { data } = await ruppiClient.post<RuppiVerifyStudentResponse>(
      ruppiConfig.verifyStudentUrl,
      {
        student_id: studentId,
        code,
        deviceType: ruppiConfig.deviceType,
      }
    );
    ruppiData = data;
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response !== null &&
      typeof error.response === 'object' &&
      'status' in error.response
    ) {
      const axiosErr = error as { response: { status: number; data?: { msg?: string } } };
      const msg = axiosErr.response.data?.msg ?? 'Verification failed';
      if (axiosErr.response.status === 404) {
        throw new AppError('Student not found', 404);
      }
      throw new AppError(msg, 400);
    }
    console.error('[AuthService] RUPPI Verify Student OTP error:', error);
    throw new AppError('Verification service is temporarily unavailable', 503);
  }

  if (!ruppiData.status) {
    throw new AppError(ruppiData.msg ?? 'Invalid verification code', 400);
  }
}

// ============================================================
// AUTH-008 — Change Password (authenticated user)
// ============================================================

interface RuppiChangePasswordResponse {
  status: boolean;
  msg: string;
  cause?: string;
  status_code?: number;
}

export async function changePassword(
  studentId: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  // Retrieve the stored RUPPI token for this user — required as user-specific auth
  const ruppiToken = await getRuppiToken(studentId);

  const formBody = new URLSearchParams({
    old_password: oldPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });

  let ruppiData: RuppiChangePasswordResponse;
  try {
    const { data } = await ruppiClient.post<RuppiChangePasswordResponse>(
      ruppiConfig.changePasswordUrl,
      formBody.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${ruppiToken}`,
        },
      }
    );
    ruppiData = data;
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response !== null &&
      typeof error.response === 'object' &&
      'status' in error.response
    ) {
      const axiosErr = error as { response: { status: number; data?: { msg?: string } } };
      const msg = axiosErr.response.data?.msg ?? 'Password change failed';
      if (axiosErr.response.status === 401) {
        throw new AppError('Current password is incorrect', 401);
      }
      throw new AppError(msg, 400);
    }
    console.error('[AuthService] RUPPI Change Password error:', error);
    throw new AppError('Change password service is temporarily unavailable', 503);
  }

  if (!ruppiData.status) {
    throw new AppError(ruppiData.msg ?? 'Password change failed', 400);
  }
}
