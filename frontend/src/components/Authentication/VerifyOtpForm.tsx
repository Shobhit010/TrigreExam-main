
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/authService";
import type { AxiosError } from "axios";

const VerifyOtpForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mobile = searchParams.get("mobile") ?? "";

  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.verifyOtp(mobile, otp);
      navigate(`/authentication/reset-password?mobile=${encodeURIComponent(mobile)}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      // Always show the actual RUPPI error message that flows through the backend
      if (axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else if (axiosErr.request) {
        setError("A network error occurred. Please check your connection.");
      } else {
        setError("OTP verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!mobile) return;
    setResendSuccess(null);
    setError(null);
    setResendLoading(true);
    try {
      await authService.forgotPassword(mobile);
      setResendSuccess("A new OTP has been sent to your mobile number.");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? "Could not resend OTP. Please try again.");
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
                src="/images/forgot-password.jpg"
                alt="verify-otp-image"
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
                <h1 className="!font-semibold !text-[22px] md:!text-xl lg:!text-2xl !mb-[5px] md:!mb-[12px]">
                  Verify OTP
                </h1>
                <p className="font-medium leading-[1.5] lg:text-md text-[#445164] dark:text-gray-400">
                  Enter the OTP sent to{" "}
                  <span className="font-semibold text-black dark:text-white">{mobile || "your mobile"}</span>.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                {resendSuccess && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
                    {resendSuccess}
                  </div>
                )}

                <div className="mb-[15px] relative">
                  <label className="mb-[10px] md:mb-[12px] text-black dark:text-white font-medium block">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500 tracking-widest text-center text-xl font-semibold"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={8}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="md:text-md block w-full text-center transition-all rounded-md font-medium mt-[20px] md:mt-[25px] py-[12px] px-[25px] text-white bg-primary-500 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-[5px]">
                    {loading ? (
                      <>
                        <i className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</i>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="material-symbols-outlined">verified</i>
                        Verify OTP
                      </>
                    )}
                  </span>
                </button>
              </form>

              <p className="mt-[15px] md:mt-[20px] text-[#445164] dark:text-gray-400">
                Didn't receive the OTP?{" "}
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={handleResendOtp}
                  className="text-primary-500 transition-all font-semibold hover:underline disabled:opacity-60"
                >
                  {resendLoading ? "Resending..." : "Resend OTP"}
                </button>
              </p>

              <p className="mt-[10px]">
                Back to{" "}
                <Link
                  to="/authentication/forgot-password"
                  className="text-primary-500 transition-all font-semibold hover:underline"
                >
                  Forgot Password
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyOtpForm;
