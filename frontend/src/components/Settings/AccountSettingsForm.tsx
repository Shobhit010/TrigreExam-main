import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

const AccountSettingsForm: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [profilePreview, setProfilePreview] = useState<string | null>(user?.profile_pic || null);

  const [formData, setFormData] = useState({
    firstName: user?.firstname || "",
    lastName: user?.lastname || "",
    mobile: user?.mobile || "",
    address: user?.address || "",
    class: user?.class || "",
    segment: user?.segment || "",
  });

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstname || "",
        lastName: user.lastname || "",
        mobile: user.mobile || "",
        address: user.address || "",
        class: user.class || "",
        segment: user.segment || "",
      });
      setProfilePreview(user.profile_pic);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB.");
        return;
      }
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Use FormData when a profile picture is included so the backend (multer) can parse the file
      const fd = new FormData();
      fd.append("firstname", formData.firstName);
      fd.append("lastname", formData.lastName);
      fd.append("mobile", formData.mobile);
      fd.append("class", formData.class);
      fd.append("segment", formData.segment);
      fd.append("address", formData.address);
      if (user?.email) {
        fd.append("email", user.email);
      }
      if (profileFile) {
        fd.append("profile_pic", profileFile);
      }
      await authService.updateProfileFormData(fd);
      await refreshProfile();
      alert("Profile updated successfully!");
    } catch (error: unknown) {
      console.error("Update failed — full error:", error);
      let msg = 'Unknown error';
      const axiosErr = error as {
        response?: { data?: { message?: string }; status?: number };
        request?: unknown;
        message?: string;
        code?: string;
      };
      if (axiosErr.response?.data?.message) {
        // Server responded with a structured error
        msg = axiosErr.response.data.message;
      } else if (axiosErr.response) {
        // Server responded, but body has no message field
        msg = `Server error (HTTP ${axiosErr.response.status})`;
      } else if (axiosErr.request) {
        // Request was made but no response received (network/CORS/timeout)
        msg = axiosErr.code === 'ECONNABORTED'
          ? 'Request timed out — please try again'
          : 'Network error — please check your connection';
      } else if (axiosErr.message) {
        msg = axiosErr.message;
      }
      alert(`Failed to update profile: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="mb-[24px]">
          <h5 className="!text-lg !mb-[4px]">Profile</h5>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Update your personal details here.
          </p>
        </div>

        <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              First Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]"
              placeholder="First Name"
              required
            />
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Last Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]"
              placeholder="Last Name"
              required
            />
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Email <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              className="h-[42px] rounded-lg text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#172036] bg-gray-50 dark:bg-[#0a0f1e] px-[16px] block w-full outline-0 transition-all cursor-not-allowed text-[14px]"
              value={user?.email || ""}
              readOnly
            />
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Mobile No <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              className="h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]"
              placeholder="Mobile Number"
              required
            />
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Class <span className="text-danger-500">*</span>
            </label>
            <select
              name="class"
              value={formData.class}
              onChange={handleInputChange}
              className="h-[42px] rounded-lg border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-black dark:text-white text-[14px]"
            >
              <option value="">Select Class</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Segment <span className="text-danger-500">*</span>
            </label>
            <select
              name="segment"
              value={formData.segment}
              onChange={handleInputChange}
              className="h-[42px] rounded-lg border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-black dark:text-white text-[14px]"
            >
              <option value="">Select Segment</option>
              <option value="science">Science</option>
              <option value="commerce">Commerce</option>
              <option value="arts">Arts</option>
            </select>
          </div>
        </div>

        {/* Profile Picture Upload */}
        <div className="mt-[28px] mb-[24px]">
          <label className="mb-[10px] text-black dark:text-white font-semibold text-[13px] block">
            Change Profile Picture
          </label>
          <div className="relative rounded-xl border-2 border-dashed border-gray-200 dark:border-[#1e2d4a] bg-gray-50/50 dark:bg-[#0a0f1e] hover:border-primary-300 dark:hover:border-primary-800 transition-all duration-300 p-6">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Avatar preview */}
              <div className="w-[72px] h-[72px] rounded-full bg-white dark:bg-[#0c1427] border-2 border-gray-200 dark:border-[#172036] shadow-sm flex items-center justify-center overflow-hidden mb-4">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <i className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[32px]">account_circle</i>
                )}
              </div>

              {/* Upload button */}
              <label
                htmlFor="profileUpload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-500 text-white text-[13px] font-semibold cursor-pointer hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 mb-2"
              >
                <i className="material-symbols-outlined text-[16px]">cloud_upload</i>
                Upload Photo
              </label>
              <input
                id="profileUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <p className="text-gray-400 dark:text-gray-500 text-[12px]">
                Drag & drop or click to upload · JPG, PNG or GIF · Max 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Address - full width */}
        <div className="mb-[20px]">
          <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
            Address <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]"
            placeholder="Enter your address"
          />
        </div>

        <div className="mt-[24px]">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`font-semibold inline-flex items-center gap-2 transition-all rounded-lg text-[14px] py-[10px] px-[28px] ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-primary-500 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25"} text-white`}
          >
            <i className="material-symbols-outlined text-[18px]">
              {isSubmitting ? "sync" : "check"}
            </i>
            {isSubmitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </>
  );
};

export default AccountSettingsForm;