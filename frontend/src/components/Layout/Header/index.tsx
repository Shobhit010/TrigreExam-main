
import React, { useEffect } from "react";

import DarkMode from "./DarkMode";

import AppsMenu from "./AppsMenu";

import Fullscreen from "./Fullscreen";
import Notifications from "./Notifications";
import ProfileMenu from "./ProfileMenu";

interface HeaderProps {
  toggleActive: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleActive }) => {
  useEffect(() => {
    const elementId = document.getElementById("header");
    const handleScroll = () => {
      if (window.scrollY > 100) {
        elementId?.classList.add("shadow-sm");
      } else {
        elementId?.classList.remove("shadow-sm");
      }
    };

    document.addEventListener("scroll", handleScroll);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []); // Added empty dependency array to avoid repeated effect calls

  return (
    <>
      <div
        id="header"
        className="header-area bg-white dark:bg-[#0c1427] py-[13px] px-[20px] md:px-[25px] fixed top-0 z-[50] rounded-b-md transition-all"
      >
        {/* Force flex-row on mobile, avoid centering items */}
        <div className="flex items-center justify-between w-full">
          {/* Hamburger Menu Group - Fixed to Left Corner */}
          <div className="flex items-center justify-start shrink-0">
            <div className="relative leading-none top-px ltr:mr-[13px] ltr:md:mr-[18px] ltr:lg:mr-[23px] rtl:ml-[13px] rtl:md:ml-[18px] rtl:lg:ml-[23px]">
              <button
                type="button"
                className="hide-sidebar-toggle transition-all inline-block hover:text-primary-500"
                onClick={toggleActive}
              >
                <i className="material-symbols-outlined !text-[20px]">menu</i>
              </button>
            </div>
          </div>

          {/* Icons Group - Fixed to Right Corner */}
          <div className="flex items-center justify-end md:gap-1">
            <AppsMenu />
            <DarkMode />
            <Fullscreen />
            <Notifications />
            <ProfileMenu />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
