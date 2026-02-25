import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarMenuProps {
  toggleActive: () => void;
}

const menuItems = [
  { path: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { path: "/my-courses", icon: "school", label: "My Courses" },
  { path: "/my-results", icon: "bar_chart", label: "My Results" },
  { path: "/my-purchases", icon: "shopping_cart", label: "My Purchases" },
  { path: "/announcements", icon: "campaign", label: "Announcements" },
  { path: "/settings", icon: "settings", label: "Settings" },
  { path: "/help", icon: "help", label: "Help" },
];

const SidebarMenu: React.FC<SidebarMenuProps> = ({ toggleActive }) => {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <>
      {/* Sidebar Container with enhanced shadow for "floating" effect */}
      <div className="sidebar-area bg-white dark:bg-[#0c1427] fixed z-[60] top-0 h-screen transition-all shadow-xl dark:shadow-gray-900 border-r border-gray-100 dark:border-[#172036] w-[280px]">

        {/* Logo Section */}
        <div className="logo bg-white dark:bg-[#0c1427] px-[30px] pt-[28px] pb-[28px] flex justify-between items-center mb-4">
          <Link
            to="/dashboard/ecommerce"
            className="flex items-center gap-3 transition-none outline-none"
          >
            <div className="text-primary-500">
              <img
                src="/images/logo-icon.svg"
                alt="logo-icon"
                width={34}
                height={34}
                className="object-contain drop-shadow-sm"
              />
            </div>
            <span className="font-bold text-2xl tracking-tighter">
              <span className="text-slate-900 dark:text-white">Trigre</span>
              <span className="text-primary-600">Exam</span>
            </span>
          </Link>

          <button
            type="button"
            className="burger-menu block lg:hidden transition-all hover:text-primary-500 text-gray-400"
            onClick={toggleActive}
          >
            <i className="material-symbols-outlined text-2xl">close</i>
          </button>
        </div>

        {/* Menu Items */}
        <div className="px-[12px] pb-[20px] h-[calc(100vh-100px)] overflow-y-auto sidebar-custom-scrollbar">
          <div className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative group flex items-center px-[24px] py-[14px] rounded-r-full overflow-hidden
                    transition-all duration-300 ease-in-out
                    ${isActive
                      ? "bg-gradient-to-r from-primary-50 to-transparent dark:from-[#15203c] dark:to-transparent text-primary-600 dark:text-primary-400 font-semibold"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#15203c]/50 font-medium hover:translate-x-1"
                    }
                  `}
                >
                  {/* Left Accent Border for Active State */}
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary-600 dark:bg-primary-500 rounded-r-lg"></span>
                  )}

                  <i
                    className={`material-symbols-outlined text-[24px] ltr:mr-[14px] rtl:ml-[14px] transition-colors duration-300
                      ${isActive ? "text-primary-600 dark:text-primary-400 scale-110" : "text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400"}
                    `}
                  >
                    {item.icon}
                  </i>
                  <span className={`text-[15px] leading-none tracking-wide ${isActive ? "ml-1" : ""} transition-all duration-300`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;