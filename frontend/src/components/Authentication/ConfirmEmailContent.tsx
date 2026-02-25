
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/authService";
import type { AxiosError } from "axios";

const ConfirmEmailContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student_id") ?? "";
  const navigate = useNavigate();

  const [code, setCode] = useState<string>("");
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setVerifyError("Student ID not found. Please register again.");
      return;
    }
    setVerifyMessage(null);
    setVerifyError(null);
    setVerifyLoading(true);
    try {
      await authService.verifyStudentOtp(studentId, code);
      setVerifyMessage("Email verified! Redirecting to sign in...");
      setTimeout(() => navigate("/authentication/sign-in"), 1500);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setVerifyError(axiosErr.response?.data?.message ?? "Invalid code. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    if (!studentId) {
      setResendError("Student ID not found. Please register again.");
      return;
    }
    setResendMessage(null);
    setResendError(null);
    setResendLoading(true);
    try {
      await authService.resendCode(studentId);
      setResendMessage("Verification email sent! Please check your inbox.");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setResendError(axiosErr.response?.data?.message ?? "Could not resend email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <div className="auth-main-content bg-white dark:bg-[#0a0e19] py-[60px] md:py-[80px] lg:py-[135px]">
        <div className="mx-auto px-[12.5px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1255px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[25px] items-center">
            <div className="xl:ltr:-mr-[25px] xl:rtl:-ml-[25px] 2xl:ltr:-mr-[45px] 2xl:rtl:-ml-[45px] rounded-[25px] order-2 lg:order-1">
              <img
                src="/images/confirm-email.jpg"
                alt="confirm-email-image"
                className="rounded-[25px]"
                width={646}
                height={804}
              />
            </div>
            <div className="xl:ltr:pl-[90px] xl:rtl:pr-[90px] 2xl:ltr:pl-[120px] 2xl:rtl:pr-[120px] order-1 lg:order-2">
              <img
                src="/images/logo-big.svg"
                alt="logo"
                className="inline-block dark:hidden"
                width={142}
                height={38}
              />
              <img
                src="/images/white-logo-big.svg"
                alt="logo"
                className="hidden dark:inline-block"
                width={142}
                height={38}
              />

              <div className="my-[17px] md:my-[25px]">
                <h1 className="!font-semibold !text-[22px] md:!text-xl lg:!text-2xl !mb-[5px] md:!mb-[10px]">
                  Welcome to TrigreExam!
                </h1>
                <p className="font-medium leading-[1.5] lg:text-md text-[#445164] dark:text-gray-400">
                  We've sent a verification link to your email. Please check
                  your inbox and verify your account to continue.
                </p>
              </div>

              <div className="flex items-center justify-center bg-[#f5f7f8] text-success-600 rounded-full w-[120px] h-[120px] dark:bg-[#15203c]">
                <i className="material-symbols-outlined !text-[55px]">mark_email_unread</i>
              </div>

              <span className="block font-medium text-black dark:text-white md:text-md mt-[20px]">
                Check your email to{" "}
                <span className="text-primary-500">verify your account</span>
              </span>

              <form onSubmit={handleVerify} className="mt-[20px]">
                <div className="mb-[15px]">
                  <label className="mb-[10px] md:mb-[12px] text-black dark:text-white font-medium block">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                    placeholder="Enter the code from your email"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    required
                  />
                </div>

                {verifyMessage && (
                  <div className="mb-3 p-3 bg-green-100 text-green-700 rounded-md text-sm">
                    {verifyMessage}
                  </div>
                )}
                {verifyError && (
                  <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                    {verifyError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="md:text-md block w-full text-center transition-all rounded-md font-medium py-[12px] px-[25px] text-white bg-primary-500 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-[5px]">
                    {verifyLoading ? (
                      <>
                        <i className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</i>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="material-symbols-outlined">verified</i>
                        Verify Email
                      </>
                    )}
                  </span>
                </button>
              </form>

              {resendMessage && (
                <div className="mt-[15px] p-3 bg-green-100 text-green-700 rounded-md text-sm">
                  {resendMessage}
                </div>
              )}
              {resendError && (
                <div className="mt-[15px] p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {resendError}
                </div>
              )}

              <button
                type="button"
                disabled={resendLoading}
                onClick={handleResend}
                className="md:text-md block w-full text-center transition-all rounded-md font-medium mt-[20px] md:mt-[25px] py-[12px] px-[25px] text-white bg-primary-500 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-[5px]">
                  {resendLoading ? (
                    <>
                      <i className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="material-symbols-outlined">send</i>
                      Resend Verification Email
                    </>
                  )}
                </span>
              </button>

              <Link
                to="/authentication/sign-in"
                className="md:text-md block w-full text-center transition-all rounded-md font-medium mt-[12px] py-[12px] px-[25px] text-primary-500 border border-primary-500 hover:bg-primary-50 dark:hover:bg-[#15203c]"
              >
                <span className="flex items-center justify-center gap-[5px]">
                  <i className="material-symbols-outlined">login</i>
                  Go to Sign In
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmEmailContent;
