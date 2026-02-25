import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`FATAL: Missing required environment variable: ${key}`);
  }
  return value.trim();
}

export const env = {
  port: parseInt(process.env['PORT'] ?? '5000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  mongoUri: requireEnv('MONGO_URI'),
  mongoDbName: requireEnv('MONGO_DB_NAME'),
  ruppiBaseUrl: requireEnv('RUPPI_BASE_URL'),
  ruppiLoginPath: requireEnv('RUPPI_LOGIN_PATH'),
  ruppiAuthRegisterPath: requireEnv('RUPPI_AUTH_REGISTER_PATH'),
  ruppiAuthForgotPasswordPath: requireEnv('RUPPI_AUTH_FORGOT_PASSWORD_PATH'),
  ruppiAuthVerifyOtpPath: requireEnv('RUPPI_AUTH_VERIFY_OTP_PATH'),
  ruppiAuthResetPasswordPath: requireEnv('RUPPI_AUTH_RESET_PASSWORD_PATH'),
  ruppiChangePasswordPath: requireEnv('RUPPI_CHANGE_PASSWORD_PATH'),
  ruppiAuthResendCodePath: requireEnv('RUPPI_AUTH_RESEND_CODE_PATH'),
  ruppiAuthVerifyStudentPath: requireEnv('RUPPI_AUTH_VERIFY_STUDENT_PATH'),
  ruppiGetProfilePath: requireEnv('RUPPI_GET_PROFILE_PATH'),
  ruppiUpdateProfilePath: requireEnv('RUPPI_UPDATE_PROFILE_PATH'),
  // Optional — set to your DLT-registered OTP template ID once obtained from RUPPI admin.
  // Without this, OTP SMS may be silently blocked by Indian telecom carriers (DLT requirement).
  ruppiOtpDltTeId: process.env['RUPPI_OTP_DLT_TE_ID']?.trim() || null,
  ruppiBearerToken: requireEnv('RUPPI_BEARER_TOKEN'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: requireEnv('JWT_EXPIRES_IN'),
  corsOrigin: requireEnv('CORS_ORIGIN'),
} as const;
