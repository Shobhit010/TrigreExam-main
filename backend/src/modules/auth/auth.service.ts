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
    lastname?: string;
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
  lastname: string;
  mobile: string;
  profile_pic: string | null;
  class?: string;
  segment?: string;
  address?: string;
  iat?: number;
  exp?: number;
}

// ---- Shape returned to the frontend ------------------------------------
export interface AuthenticatedUser {
  id: string;
  student_id: string;
  email: string;
  firstname: string;
  lastname: string;
  name: string;
  mobile: string;
  profile_pic: string | null;
  class?: string;
  segment?: string;
  address?: string;
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

  // Step 4: Sync user in MongoDB
  const now = new Date();
  const existingUser = await UserModel.findOne({ student_id: ruppiUser.student_id });

  // Fields RUPPI always owns (identity/auth fields) — these always sync
  const updatePayload: Record<string, any> = {
    email: ruppiUser.email ?? '',
    mobile: ruppiUser.mobile,
    ruppi_token_encrypted: encryptedRuppiToken,
    last_login: now,
  };

  // If this is a new user OR the local field is missing, sync from RUPPI.
  // We prefer local values for name/pic/segment after the initial creation
  // to support the 'local-first' strategy the user requested.
  if (!existingUser) {
    updatePayload.firstname = ruppiUser.firstname;
    updatePayload.lastname = ruppiUser.lastname ?? '';
    updatePayload.profile_pic = ruppiUser.profile_pic;
    if ((ruppiUser as any).class) updatePayload.class = (ruppiUser as any).class;
    if ((ruppiUser as any).segment) updatePayload.segment = (ruppiUser as any).segment;
    if ((ruppiUser as any).address) updatePayload.address = (ruppiUser as any).address;
  } else {
    // For existing users, only sync if local field is empty
    if (!existingUser.firstname) updatePayload.firstname = ruppiUser.firstname;
    if (!existingUser.lastname) updatePayload.lastname = ruppiUser.lastname ?? '';

    // For profile_pic, only sync from RUPPI if we don't have a local Base64 image
    if (!existingUser.profile_pic || !existingUser.profile_pic.startsWith('data:')) {
      if (ruppiUser.profile_pic) updatePayload.profile_pic = ruppiUser.profile_pic;
    }

    if (!existingUser.class && (ruppiUser as any).class) updatePayload.class = (ruppiUser as any).class;
    if (!existingUser.segment && (ruppiUser as any).segment) updatePayload.segment = (ruppiUser as any).segment;
    if (!existingUser.address && (ruppiUser as any).address) updatePayload.address = (ruppiUser as any).address;
  }

  const user = await UserModel.findOneAndUpdate(
    { student_id: ruppiUser.student_id },
    { $set: updatePayload },
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
    lastname: user.lastname,
    mobile: user.mobile,
    profile_pic: user.profile_pic,
    class: user.class,
    segment: user.segment,
    address: user.address,
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
    firstname: user.firstname,
    lastname: user.lastname,
    name: `${user.firstname} ${user.lastname}`.trim(),
    mobile: user.mobile,
    profile_pic: user.profile_pic,
    class: user.class,
    segment: user.segment,
    address: user.address,
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

  if (!user || !user.ruppi_token_encrypted) {
    throw new AppError('RUPPI session token not found. Please log in again.', 401);
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

// ============================================================
// PROFILE — Get Profile
// ============================================================

interface RuppiGetProfileResponse {
  status: boolean;
  status_code: number;
  data: {
    firstname: string;
    lastname?: string;
    mobile: string;
    email: string;
    student_id: string;
    profile_pic: string | null;
  };
  msg: string;
}

export async function getProfileWithRuppi(studentId: string): Promise<AuthenticatedUser> {
  const ruppiToken = await getRuppiToken(studentId);

  console.log('[AuthService] RUPPI Get Profile → GET', ruppiConfig.getProfileUrl);

  // Helper: return the locally-cached MongoDB user document as AuthenticatedUser
  async function getLocalUser(): Promise<AuthenticatedUser> {
    const localUser = await UserModel.findOne({ student_id: studentId });
    if (!localUser) throw new AppError('User record not found', 404);
    return {
      id: localUser._id.toString(),
      student_id: localUser.student_id,
      email: localUser.email,
      firstname: localUser.firstname,
      lastname: localUser.lastname,
      name: `${localUser.firstname} ${localUser.lastname}`.trim(),
      mobile: localUser.mobile,
      profile_pic: localUser.profile_pic,
      class: localUser.class,
      segment: localUser.segment,
      address: localUser.address,
    };
  }

  let ruppiResponse: RuppiGetProfileResponse;
  try {
    const { data } = await ruppiClient.get<RuppiGetProfileResponse>(
      ruppiConfig.getProfileUrl,
      { headers: { Authorization: `Bearer ${ruppiToken}` } }
    );
    ruppiResponse = data;
    console.log('[AuthService] RUPPI Get Profile success for:', studentId);
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status: number } };
    if (axiosErr.response?.status === 401) {
      // RUPPI session token has expired — fall back to last-known MongoDB data
      console.warn('[AuthService] RUPPI token expired for', studentId, '— serving local cache');
      return getLocalUser();
    }
    console.error('[AuthService] RUPPI Get Profile network error:', error);
    // On any other network error, also fall back to local cache rather than returning 503
    console.warn('[AuthService] RUPPI unreachable — serving local cache for', studentId);
    return getLocalUser();
  }

  if (!ruppiResponse.status || !ruppiResponse.data) {
    console.warn('[AuthService] RUPPI returned status:false — serving local cache');
    return getLocalUser();
  }

  const { data: ruppiUser } = ruppiResponse;
  const existingUser = await UserModel.findOne({ student_id: studentId });

  // Sync fresh RUPPI data into MongoDB — but preserve locally-updated fields.
  const updateFields: Record<string, unknown> = {
    email: ruppiUser.email ?? '',
    mobile: ruppiUser.mobile,
  };

  // Only sync profile fields if they are missing locally or if we're not using a local-first override
  if (existingUser) {
    if (!existingUser.firstname) updateFields.firstname = ruppiUser.firstname;
    if (!existingUser.lastname) updateFields.lastname = ruppiUser.lastname ?? '';

    // For profile_pic, only sync from RUPPI if we don't have a local Base64 image
    if (!existingUser.profile_pic || !existingUser.profile_pic.startsWith('data:')) {
      if (ruppiUser.profile_pic) updateFields.profile_pic = ruppiUser.profile_pic;
    }

    if (!existingUser.class) updateFields.class = (ruppiUser as any).class ?? '';
    if (!existingUser.segment) updateFields.segment = (ruppiUser as any).segment ?? '';
    if (!existingUser.address) updateFields.address = (ruppiUser as any).address ?? '';
  } else {
    // New user scenario
    updateFields.firstname = ruppiUser.firstname;
    updateFields.lastname = ruppiUser.lastname ?? '';
    updateFields.profile_pic = ruppiUser.profile_pic;
    updateFields.class = (ruppiUser as any).class ?? '';
    updateFields.segment = (ruppiUser as any).segment ?? '';
    updateFields.address = (ruppiUser as any).address ?? '';
  }

  const user = await UserModel.findOneAndUpdate(
    { student_id: studentId },
    { $set: updateFields },
    { new: true, upsert: true }
  );

  if (!user) throw new AppError('User record not found', 404);

  return {
    id: user._id.toString(),
    student_id: user.student_id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    name: `${user.firstname} ${user.lastname}`.trim(),
    mobile: user.mobile,
    profile_pic: user.profile_pic,
    class: user.class,
    segment: user.segment,
    address: user.address,
  };
}

// ============================================================
// PROFILE — Update Profile
// ============================================================

interface RuppiUpdateProfileResponse {
  status: boolean;
  msg: string;
  status_code?: number;
}

export async function updateProfileWithRuppi(
  studentId: string,
  updateData: {
    firstname?: string;
    lastname?: string;
    mobile?: string;
    email?: string;
    profile_pic?: string;
    class?: string;
    segment?: string;
    address?: string;
  },
  profilePicFile?: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<void> {
  const ruppiToken = await getRuppiToken(studentId);

  // Build the MongoDB update payload first — used whether RUPPI succeeds or not
  const mongodbUpdate: Record<string, string> = {};
  if (updateData.firstname !== undefined) mongodbUpdate['firstname'] = updateData.firstname;
  if (updateData.lastname !== undefined) mongodbUpdate['lastname'] = updateData.lastname;
  if (updateData.email !== undefined) mongodbUpdate['email'] = updateData.email;
  if (updateData.mobile !== undefined) mongodbUpdate['mobile'] = updateData.mobile;
  if (updateData.class !== undefined) mongodbUpdate['class'] = updateData.class;
  if (updateData.segment !== undefined) mongodbUpdate['segment'] = updateData.segment;
  if (updateData.address !== undefined) mongodbUpdate['address'] = updateData.address;

  console.log('[AuthService] updateProfileWithRuppi - studentId:', studentId);
  console.log('[AuthService] updateData keys:', Object.keys(updateData));
  console.log('[AuthService] mongodbUpdate keys:', Object.keys(mongodbUpdate));

  // If an actual file was uploaded, convert it to a Base64 data URL for local storage.
  // This ensures the profile picture is always persisted, even when the RUPPI session
  // token has expired and we can't reach the RUPPI CDN.
  if (profilePicFile) {
    const base64 = profilePicFile.buffer.toString('base64');
    const dataUrl = `data:${profilePicFile.mimetype};base64,${base64}`;
    mongodbUpdate['profile_pic'] = dataUrl;
    console.log('[AuthService] Profile pic converted to base64 data URL, size:', base64.length, 'chars');
  }

  async function saveLocally(): Promise<void> {
    try {
      if (Object.keys(mongodbUpdate).length > 0) {
        const result = await UserModel.updateOne({ student_id: studentId }, { $set: mongodbUpdate });
        console.log('[AuthService] Profile save to local MongoDB result:', JSON.stringify(result), 'for student_id:', studentId);
        if (result.matchedCount === 0) {
          console.error('[AuthService] CRITICAL: No user matched for student_id:', studentId);
        }
      } else {
        console.log('[AuthService] No local fields to update for:', studentId);
      }
    } catch (err) {
      console.error('[AuthService] Failed to save locally to MongoDB:', err);
    }
  }

  // CRITICAL: Save locally FIRST. The local DB is the source of truth for our app.
  await saveLocally();

  const form = new FormData();
  if (updateData.firstname !== undefined) form.append('firstname', updateData.firstname);
  if (updateData.lastname !== undefined) form.append('lastname', updateData.lastname);
  if (updateData.mobile !== undefined) form.append('mobile', updateData.mobile);
  if (updateData.email !== undefined) form.append('email', updateData.email);

  // Append actual image file buffer if provided
  if (profilePicFile) {
    form.append('profile_pic', profilePicFile.buffer, {
      filename: profilePicFile.originalname,
      contentType: profilePicFile.mimetype,
    });
  }

  if (updateData.class !== undefined) form.append('class', updateData.class);
  if (updateData.segment !== undefined) form.append('segment', updateData.segment);
  if (updateData.address !== undefined) form.append('address', updateData.address);

  // Identifying info for RUPPI
  form.append('student_id', studentId);
  form.append('deviceType', 'web');
  form.append('device_type', 'web'); // Alias for older endpoints

  let ruppiResponse: RuppiUpdateProfileResponse;
  try {
    console.log('[AuthService] RUPPI Update Profile → POST', ruppiConfig.updateProfileUrl, '| student_id:', studentId);

    const { data } = await ruppiClient.post<RuppiUpdateProfileResponse>(
      ruppiConfig.updateProfileUrl,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${ruppiToken}`,
        },
      }
    );
    ruppiResponse = data;
    console.log('[AuthService] RUPPI Update Profile response:', JSON.stringify(ruppiResponse));
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status: number; data?: { msg?: string } } };
    if (axiosErr.response?.status === 401) {
      // RUPPI session token has expired — save locally and return success so the
      // user's profile still updates correctly until they log in again.
      console.warn('[AuthService] RUPPI token expired — saving profile locally only for:', studentId);
      await saveLocally();
      return;
    }
    if (axiosErr.response) {
      console.error('[AuthService] RUPPI Update Profile error:', axiosErr.response.status, JSON.stringify(axiosErr.response.data));
      throw new AppError(axiosErr.response.data?.msg ?? 'Failed to update profile', 400);
    }
    // Network error — save locally rather than failing completely
    console.error('[AuthService] RUPPI Update Profile network error — saving locally');
    await saveLocally();
    return;
  }

  if (!ruppiResponse.status) {
    console.warn('[AuthService] RUPPI Update Profile rejected (status:false):', JSON.stringify(ruppiResponse));
    // Data is already saved locally, so we consider this a success for the user.
    return;
  }

  console.log('[AuthService] RUPPI Update Profile sync successful for:', studentId);
}


