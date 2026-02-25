import { env } from './env';

export const ruppiConfig = {
  baseUrl: env.ruppiBaseUrl,
  loginUrl: `${env.ruppiBaseUrl}${env.ruppiLoginPath}`,
  registerUrl: `${env.ruppiBaseUrl}${env.ruppiAuthRegisterPath}`,
  forgotPasswordUrl: `${env.ruppiBaseUrl}${env.ruppiAuthForgotPasswordPath}`,
  verifyOtpUrl: `${env.ruppiBaseUrl}${env.ruppiAuthVerifyOtpPath}`,
  resetPasswordUrl: `${env.ruppiBaseUrl}${env.ruppiAuthResetPasswordPath}`,
  changePasswordUrl: `${env.ruppiBaseUrl}${env.ruppiChangePasswordPath}`,
  resendCodeUrl: `${env.ruppiBaseUrl}${env.ruppiAuthResendCodePath}`,
  verifyStudentUrl: `${env.ruppiBaseUrl}${env.ruppiAuthVerifyStudentPath}`,
  getProfileUrl: `${env.ruppiBaseUrl}${env.ruppiGetProfilePath}`,
  updateProfileUrl: `${env.ruppiBaseUrl}${env.ruppiUpdateProfilePath}`,
  bearerToken: env.ruppiBearerToken,
  deviceType: 'web' as const,
  timeoutMs: 10000,
} as const;
