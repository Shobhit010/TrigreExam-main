import ChangePasswordForm from "../../components/Settings/ChangePasswordForm";
import Nav from "../../components/Settings/Nav";

const ChangePassword = () => {
  return (
    <>
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-[25px] gap-[15px]">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white mb-1">
            Change Password
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Update your password to keep your account secure.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white dark:bg-[#0c1427] rounded-md border border-gray-100 dark:border-[#172036] p-[20px] md:p-[25px]">
        <Nav />

        <ChangePasswordForm />
      </div>
    </>
  );
};

export default ChangePassword;
