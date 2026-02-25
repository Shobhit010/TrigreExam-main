import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/authService";
import type { AxiosError } from "axios";

const ChangePasswordForm: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Show/hide toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword, confirmPassword);
      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else if (axiosErr.response?.status === 401) {
        setError("Current password is incorrect.");
      } else if (axiosErr.request) {
        setError("A network error occurred. Please check your connection.");
      } else {
        setError("Could not change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] pr-[42px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]";
  const labelClass = "mb-[8px] text-black dark:text-white font-semibold text-[13px] block";
  const eyeClass =
    "absolute right-[12px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer select-none material-symbols-outlined text-[18px]";

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="mb-[24px]">
          <h5 className="!text-lg !mb-[4px]">Change Password</h5>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Update your password to keep your account secure.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800">
            <span className="material-symbols-outlined text-[16px] align-middle mr-1">
              error
            </span>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm border border-green-200 dark:border-green-800">
            <span className="material-symbols-outlined text-[16px] align-middle mr-1">
              check_circle
            </span>
            {success}
          </div>
        )}

        <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
          {/* Old Password */}
          <div className="mb-[20px] sm:mb-0 relative">
            <label className={labelClass}>
              Old Password <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                className={inputClass}
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <span
                className={eyeClass}
                onClick={() => setShowOld((v) => !v)}
                title={showOld ? "Hide" : "Show"}
              >
                {showOld ? "visibility_off" : "visibility"}
              </span>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-[20px] sm:mb-0 relative">
            <label className={labelClass}>
              New Password <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className={inputClass}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <span
                className={eyeClass}
                onClick={() => setShowNew((v) => !v)}
                title={showNew ? "Hide" : "Show"}
              >
                {showNew ? "visibility_off" : "visibility"}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="sm:col-span-2 mb-[20px] sm:mb-0 relative">
            <label className={labelClass}>
              Confirm New Password <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className={inputClass}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <span
                className={eyeClass}
                onClick={() => setShowConfirm((v) => !v)}
                title={showConfirm ? "Hide" : "Show"}
              >
                {showConfirm ? "visibility_off" : "visibility"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-[24px] flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="font-semibold inline-flex items-center gap-2 transition-all rounded-lg text-[14px] py-[10px] px-[28px] bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i
                  className="material-symbols-outlined text-[18px]"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  progress_activity
                </i>
                Changing...
              </>
            ) : (
              <>
                <i className="material-symbols-outlined text-[18px]">lock_reset</i>
                Change Password
              </>
            )}
          </button>

          <Link
            to="/authentication/forgot-password"
            className="text-primary-500 hover:text-primary-600 text-[13px] font-medium transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
      </form>
    </>
  );
};

export default ChangePasswordForm;