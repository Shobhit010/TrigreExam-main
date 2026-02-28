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
// NOTE: profile_pic is intentionally excluded — Base64 images can be hundreds
// of KB and would inflate the Authorization header past Node's 8 KB limit (HTTP 431).
// Profile data including profile_pic is fetched fresh from MongoDB on /api/auth/profile.
export interface JwtPayload {
  sub: string;
  student_id: string;
  email: string;
  firstname: string;
  lastname: string;
  mobile: string;
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
  // Step 0: Check Local Password First (Local-First-Strategy)
  // We check by mobile because username is usually the mobile in this system.
  // Pro-Tip: Find ALL users with this mobile to handle duplicates gracefully.
  const localUsers = await UserModel.find({ mobile: username }).select('+password +ruppi_token_encrypted');
  let localPasswordMatched = false;
  let localUser: IUser | undefined;

  for (const user of localUsers) {
    if (user.password) {
      const hashed = crypto.createHash('sha256').update(password).digest('hex');
      if (hashed === user.password) {
        console.log('[AuthService] Local password matched for record:', user.student_id);
        localPasswordMatched = true;
        localUser = user;
        break;
      }
    }
  }

  // If we didn't match a password but have records, pick the most recent one as a fallback for RUPPI
  if (!localUser && localUsers.length > 0) {
    localUser = localUsers[localUsers.length - 1];
  }

  // Step 1 & 2: Authenticate
  let studentId: string;
  let ruppiToken: string;
  let ruppiFreshData: any = null;

  if (localPasswordMatched && localUser) {
    // SCENARIO A: LOCAL MATCH (Secure & Fast)
    console.log('[AuthService] Local password match. Using stored RUPPI token.');
    studentId = localUser.student_id;
    try {
      ruppiToken = decryptToken(localUser.ruppi_token_encrypted);
    } catch (e) {
      console.error('[AuthService] Failed to decrypt stored RUPPI token during local-first login');
      throw new AppError('Internal authentication error. Please contact support.', 500);
    }
  } else if (localUsers.length > 0 && localUsers.some(u => u.password)) {
    // SCENARIO B: LOCAL EXISTS BUT NO MATCH (Security Block)
    // If any of the local accounts have a password set, we MUST match one of them.
    // We do NOT allow falling back to RUPPI (which might still accept the OLD password).
    console.warn('[AuthService] Local record found with password, but match failed. Blocking RUPPI fallback.');
    throw new AppError('Invalid credentials. Please use your new password.', 401);
  } else {
    // SCENARIO C: NO LOCAL PASSWORD YET, TRY RUPPI
    console.log(`[AuthService] No local pass match. Calling RUPPI → POST ${ruppiConfig.loginUrl}`);
    try {
      const response = await ruppiClient.post<RuppiLoginResponse>(
        ruppiConfig.loginUrl,
        {
          username,
          password,
          deviceType: ruppiConfig.deviceType,
        }
      );
      const ruppiResponse = response.data;
      if (!ruppiResponse.status || !ruppiResponse.token || !ruppiResponse.data?.student_id) {
        throw new AppError(ruppiResponse.msg ?? 'Invalid credentials', 401);
      }
      studentId = ruppiResponse.data.student_id;
      ruppiToken = ruppiResponse.token;
      ruppiFreshData = ruppiResponse.data;
      console.log('[AuthService] RUPPI login successful.');
    } catch (error: any) {
      const msg = error.response?.data?.msg || 'Invalid credentials';
      console.error('[AuthService] Authentication failed:', msg);
      throw new AppError(msg, 401);
    }
  }

  // Step 3: Encrypt RUPPI token (if fresh) and Sync user in MongoDB
  const now = new Date();
  const encryptedRuppiToken = encryptToken(ruppiToken);

  const updatePayload: Record<string, any> = {
    ruppi_token_encrypted: encryptedRuppiToken,
    last_login: now,
  };

  // If we had a successful RUPPI response, sync their identity fields
  if (ruppiFreshData) {
    updatePayload.email = ruppiFreshData.email ?? '';
    updatePayload.mobile = ruppiFreshData.mobile;
    if (!localUser) {
      updatePayload.firstname = ruppiFreshData.firstname;
      updatePayload.lastname = ruppiFreshData.lastname ?? '';
      updatePayload.profile_pic = ruppiFreshData.profile_pic;
    }
  }

  const user = await UserModel.findOneAndUpdate(
    { student_id: studentId },
    { $set: updatePayload },
    { upsert: true, new: true }
  ) as IUser;

  // Step 4: Issue backend JWT
  const jwtPayload: JwtPayload = {
    sub: (user._id as mongoose.Types.ObjectId).toString(),
    student_id: user.student_id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    mobile: user.mobile,
    class: user.class,
    segment: user.segment,
    address: user.address,
  };

  const token = jwt.sign(jwtPayload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'trigreexam-backend',
    audience: 'trigreexam-frontend',
  });

  return {
    token,
    user: {
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
    },
  };
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
  const ruppiToken = await getRuppiToken(studentId);

  // --- LOCAL FIRST: Securely hash and save the password locally ---
  const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
  let localUpdated = false;
  try {
    const updateResult = await UserModel.updateOne(
      { student_id: studentId },
      { $set: { password: hashedPassword } }
    );
    console.log('[AuthService] Local DB Password Update Result:', JSON.stringify(updateResult));
    localUpdated = true;
  } catch (dbErr) {
    console.error('[AuthService] Failed to save hashed password locally:', dbErr);
  }

  // --- RUPPI SYNC: Attempt sync but don't block local success ---
  try {
    console.log('[AuthService] Attempting RUPPI Password Sync...');

    const hardcodedId = '68ce944e4991c520411a5a83';
    const urls = [
      ruppiConfig.changePasswordUrl,
      `${ruppiConfig.changePasswordUrl}/${hardcodedId}`
    ];

    async function attemptCall(url: string, data: any, contentType: 'json' | 'form-data'): Promise<RuppiChangePasswordResponse> {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${ruppiToken}`,
      };
      if (contentType === 'json') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await ruppiClient.post<RuppiChangePasswordResponse>(
        url,
        data,
        { headers: contentType === 'form-data' ? { ...headers, ...data.getHeaders?.() } : headers }
      );
      return response.data;
    }

    let synced = false;
    let lastRuppiMsg = '';

    for (const url of urls) {
      if (synced) break;
      const payloadVariants = [
        { old_password: oldPassword, new_password: newPassword, confirm_password: confirmPassword, student_id: studentId, deviceType: 'web' },
        { old_password: oldPassword, password: newPassword, confirm_password: confirmPassword, student_id: studentId, deviceType: 'web' }
      ];

      for (const payload of payloadVariants) {
        if (synced) break;
        // 1. Try JSON
        try {
          const result = await attemptCall(url, payload, 'json');
          if (result.status) { synced = true; break; }
          lastRuppiMsg = result.msg;
        } catch (e) { }

        // 2. Try FormData
        try {
          const fd = new FormData();
          Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
          const result = await attemptCall(url, fd, 'form-data');
          if (result.status) { synced = true; break; }
          lastRuppiMsg = result.msg;
        } catch (e) { }
      }
    }

    if (synced) {
      console.log('[AuthService] RUPPI Synchronized successfully.');
    } else {
      console.warn('[AuthService] RUPPI Sync failed (Session expired or credential error), but local update succeeded.');
      // If synced failed but it was a clear credential error, we should still tell the user
      if (lastRuppiMsg.toLowerCase().includes('password') || lastRuppiMsg.toLowerCase().includes('incorrect')) {
        throw new AppError('Current password is incorrect according to the provider, but updated locally.', 401);
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[AuthService] RUPPI Sync encountered an error:', err);
  }

  if (!localUpdated) {
    throw new AppError('Failed to update password. Internal database error.', 500);
  }

  console.log('[AuthService] Password updated successfully for student_id:', studentId);
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


