import React, { useState } from "react";

const AccountSettingsForm: React.FC = () => {
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  return (
    <>
      <form>
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
              className="h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]"
              defaultValue="Default"
            />
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Last Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              className="h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]"
              defaultValue="Default"
            />
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Email <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              className="h-[42px] rounded-lg text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#172036] bg-gray-50 dark:bg-[#0a0f1e] px-[16px] block w-full outline-0 transition-all cursor-not-allowed text-[14px]"
              defaultValue="Institute Email"
              readOnly
            />
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Mobile No <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              className="h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]"
              defaultValue="7633849115"
            />
          </div>

          <div className="mb-[20px] sm:mb-0">
            <label className="mb-[8px] text-black dark:text-white font-semibold text-[13px] block">
              Class <span className="text-danger-500">*</span>
            </label>
            <select className="h-[42px] rounded-lg border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-black dark:text-white text-[14px]">
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
            <select className="h-[42px] rounded-lg border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-black dark:text-white text-[14px]">
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
            className="h-[42px] rounded-lg text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[16px] block w-full outline-0 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 text-[14px]"
            placeholder="Enter your address"
          />
        </div>

        <div className="mt-[24px]">
          <button
            type="button"
            className="font-semibold inline-flex items-center gap-2 transition-all rounded-lg text-[14px] py-[10px] px-[28px] bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25"
          >
            <i className="material-symbols-outlined text-[18px]">check</i>
            Submit
          </button>
        </div>
      </form>
    </>
  );
};

export default AccountSettingsForm;