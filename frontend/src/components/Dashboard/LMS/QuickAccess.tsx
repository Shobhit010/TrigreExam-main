import React from "react";
import { Link } from "react-router-dom";

const QuickAccess: React.FC = () => {
    const items = [
        {
            title: "Announcements",
            icon: "campaign",
            link: "/announcements",
            color: "text-indigo-500",
            bg: "bg-indigo-100",
        },
        {
            title: "Documents",
            icon: "description",
            link: "/documents",
            color: "text-purple-600",
            bg: "bg-purple-100",
        },
        {
            title: "Results",
            icon: "bar_chart",
            link: "/my-results",
            color: "text-emerald-600",
            bg: "bg-emerald-100",
        },
        {
            title: "Contact Us",
            icon: "contact_support",
            link: "/front-pages/contact",
            color: "text-orange-500",
            bg: "bg-orange-100",
        },
    ];

    return (
        <div className="trezo-card bg-white dark:bg-[#0c1427] p-[22px] md:p-[26px] rounded-2xl">
            {/* Header */}
            <h5 className="text-[17px] font-semibold text-gray-800 dark:text-white mb-[18px]">
                Quick Access
            </h5>

            {/* Horizontal cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                {items.map((item, index) => (
                    <Link
                        key={index}
                        to={item.link}
                        className="
                            flex items-center gap-[12px]
                            px-[10px] py-[18px] min-h-[74px]
                            rounded-xl
                            bg-gray-50 dark:bg-[#15203c]
                            hover:bg-blue-50 dark:hover:bg-[#15203c]
                            hover:-translate-y-1 hover:shadow-md
                            transition-all
                            font-sans
                        "
                    >
                        {/* Icon */}
                        <div
                            className={`
                                w-[40px] h-[40px]
                                rounded-full
                                flex items-center justify-center
                                text-[20px]
                                ${item.bg} ${item.color}
                            `}
                        >
                            <i className="material-symbols-outlined font-light">
                                {item.icon}
                            </i>
                        </div>

                        {/* Text */}
                        <span
                            className="
                                text-[12px]
                                font-bold
                                tracking-[0.15px]
                                text-gray-700 dark:text-gray-200
                            "
                        >
                            {item.title}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default QuickAccess;
