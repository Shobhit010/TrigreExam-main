
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header/index";
import SidebarMenu from "./SidebarMenu/index";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [active, setActive] = useState<boolean>(false);
    const location = useLocation();
    const pathname = location.pathname;

    const toggleActive = (): void => {
        setActive(!active);
    };

    const isAuthPage = [
        "/authentication/sign-in",
        "/authentication/sign-up",
        "/authentication/forgot-password",
        "/authentication/reset-password",
        "/authentication/confirm-email",
        "/authentication/lock-screen",
        "/authentication/logout",
        "/coming-soon",
        "/",
        "/front-pages/features",
        "/front-pages/team",
        "/front-pages/faq",
        "/front-pages/contact",
        "/lms/video-course-player",
    ].includes(pathname);

    if (isAuthPage) {
        return (
            <div key={pathname} className="animate-fade-in-up">
                {children}
            </div>
        );
    }

    return (
        <>
            <div className={`main-content-wrap transition-all ${active ? "active" : ""}`}>
                <SidebarMenu toggleActive={toggleActive} />

                {/* Mobile sidebar backdrop overlay */}
                {active && (
                    <div
                        className="fixed inset-0 bg-black/40 z-[55] xl:hidden"
                        onClick={toggleActive}
                    />
                )}

                <div className="main-content transition-all flex flex-col overflow-hidden min-h-screen">
                    <Header toggleActive={toggleActive} />

                    <div key={pathname} className="animate-fade-in-up">
                        {children}
                    </div>


                </div>
            </div>
        </>
    );
};

export default Layout;
