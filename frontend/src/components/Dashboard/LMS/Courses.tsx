import React, { useState } from "react";
import { Link } from "react-router-dom";

/* ================================
   🎨 DESIGN TOKENS
================================ */
const CARD_THEME = {
    vertical: {
        wrapper:
            "trezo-card bg-white dark:bg-[#0c1427] rounded-2xl overflow-hidden shadow-sm flex-shrink-0 border border-gray-100 dark:border-[#172036] hover:-translate-y-1 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-[#15203c] transition-all duration-300 cursor-pointer flex flex-col h-[420px]",
        imageWrapper: "h-[130px] w-full overflow-hidden flex-shrink-0",
        content: "flex flex-col flex-grow justify-between",
    },
    horizontal: {
        wrapper:
            "trezo-card bg-white dark:bg-[#0c1427] rounded-2xl overflow-hidden w-full h-[105px] shadow-sm flex-shrink-0 border border-gray-100 dark:border-[#172036] hover:-translate-y-1 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-[#15203c] transition-all duration-300 cursor-pointer flex",
        imageWrapper: "w-[105px] h-full overflow-hidden flex-shrink-0 relative", // Left side image/thumbnail
        content: "p-[8px] flex flex-col flex-grow justify-between", // Right side content
    },
    title:
        "!text-[17px] md:!text-[17px] font-medium text-black dark:text-white leading-snug truncate",
    subtitle: "text-gray-500 text-[10px] truncate",
    statText: "text-gray-500 text-[10px] font-medium flex items-center gap-1",
    expiryBox:
        "flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-1 rounded-md",
    button:
        "block w-full text-center bg-white border border-primary-500 text-primary-500 font-medium py-1 rounded-md transition-all duration-300 hover:bg-primary-500 hover:text-white flex items-center justify-center gap-1 text-[10px]",
};

// Helper function to get random image
const getRandomImage = () => {
    const images = ["/images/cat.webp", "/images/upsc.webp", "/images/ssc.png"];
    return images[Math.floor(Math.random() * images.length)];
};

export type Course = {
    id: number;
    title: string;
    subtitle: string;
    shortDescription?: string;
    image: string;
    progress: number;
    totalTests: number;
    completedTests: number;
    expiryDate: string;
    viewLink: string;
    totalVideos: number;
    courseType?: "video" | "test";
    price?: string;
    originalPrice?: string;
    discount?: string;
    features?: string[];
};

interface CourseListProps {
    title: string;
    courses: Course[];
    variant?: "vertical" | "horizontal";
}

const Courses: React.FC<CourseListProps> = ({
    title,
    courses,
    variant = "vertical",
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // If vertical, show only 3 unless expanded. If horizontal, show all (or handle differently)
    const displayedCourses =
        variant === "vertical" && !isExpanded ? courses.slice(0, 3) : courses;

    return (
        <div
            className={
                variant === "horizontal"
                    ? "trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-2xl border border-gray-100 dark:border-[#172036] h-full"
                    : "mb-[25px]"
            }
        >
            <div
                className={
                    variant === "horizontal"
                        ? "trezo-card-header mb-[20px] pb-4 border-b border-gray-100 dark:border-[#172036] flex items-center justify-between"
                        : "mb-[15px] flex items-center justify-between"
                }
            >
                <h5
                    className={`font-bold text-[18px] dark:text-white ${variant === "horizontal" ? "!mb-0" : ""
                        }`}
                >
                    {title}
                </h5>
            </div>

            <div
                className={
                    variant === "horizontal"
                        ? "flex flex-col gap-[15px]" // Vertical list for horizontal variant
                        : "flex flex-wrap justify-center gap-[25px]"
                }
            >
                {displayedCourses.map((course) => {
                    if (variant === "horizontal") {
                        return (
                            <div
                                key={course.id}
                                className="border border-gray-100 dark:border-[#172036] rounded-xl p-4 flex items-center gap-4 bg-white dark:bg-[#0c1427] hover:shadow-md hover:-translate-y-1 hover:bg-blue-50 dark:hover:bg-[#15203c] transition-all duration-300"
                            >
                                {/* Left: Image (replacing Icon) */}
                                <div className="w-[50px] h-[50px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                    <img
                                        src={getRandomImage()}
                                        alt={course.title}
                                        className="w-full h-full object-cover object-right"
                                    />
                                </div>

                                {/* Middle: Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="mb-2">
                                        <h3 className="!text-[13.5px] md:!text-[14px] font-semibold text-black dark:text-white leading-tight truncate">


                                            {course.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-[11px] text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <img
                                                src="/images/play.png"
                                                alt="play"
                                                className="w-[14px] h-[14px] object-contain opacity-60"
                                            />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{course.totalVideos} Videos</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <img
                                                src="/images/paper2.png"
                                                alt="tests"
                                                className="w-[14px] h-[14px] object-contain"
                                            />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{course.totalTests} Tests</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <img
                                                src="/images/schedule.png" // or agenda.svg / calendar.svg if available
                                                alt="calendar"
                                                className="w-[14px] h-[14px] object-contain opacity-60"
                                            />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Exp: {course.expiryDate}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Action Button */}
                                <div className="flex-shrink-0">
                                    <Link
                                        to={course.viewLink}
                                        className="bg-white border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white text-[12px] font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                                    >
                                        <i className="material-symbols-outlined text-[16px]">play_arrow</i>
                                        Continue
                                    </Link>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={course.id} className={`${CARD_THEME[variant].wrapper} w-[320px]`}>
                            {/* Image Section */}
                            <div className={CARD_THEME[variant].imageWrapper}>
                                <img
                                    src={getRandomImage()}
                                    alt={course.title}
                                    className="w-full h-full object-cover object-top"
                                />
                            </div>

                            {/* Content Section */}
                            <div className={CARD_THEME[variant].content}>
                                <div className="p-3">
                                    <h3 className="!text-[16px] font-bold text-black dark:text-white leading-tight mb-2">
                                        {course.title}
                                    </h3>

                                    {/* Description */}
                                    {course.shortDescription && (
                                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                            {course.shortDescription}
                                        </p>
                                    )}

                                    {/* Stats Row */}
                                    <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-[10px] text-gray-500 dark:text-gray-400 mb-4">
                                        <div className="flex items-center gap-1">
                                            <img
                                                src="/images/play.png"
                                                alt="play"
                                                className="w-[14px] h-[14px] object-contain opacity-60"
                                            />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{course.totalVideos} Videos</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <img
                                                src="/images/paper2.png"
                                                alt="tests"
                                                className="w-[14px] h-[14px] object-contain"
                                            />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{course.totalTests} Tests</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <img
                                                src="/images/schedule.png"
                                                alt="calendar"
                                                className="w-[14px] h-[14px] object-contain opacity-60"
                                            />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Validity 1 year</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price & Action Section */}
                                <div className="mt-auto p-3 border-t border-gray-100 dark:border-[#172036]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500 font-bold text-lg">{course.price}</span>
                                            <span className="text-gray-400 text-sm line-through decoration-gray-400">{course.originalPrice}</span>
                                        </div>
                                        {course.discount && (
                                            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                                <i className="material-symbols-outlined text-[12px]">local_offer</i>
                                                {course.discount}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="w-full py-2 border border-black dark:border-white text-black dark:text-white font-bold text-[12px] rounded uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                                            Detail
                                        </button>
                                        <button className="w-full py-2 bg-white border border-sky-500 text-sky-500 font-bold text-[12px] rounded uppercase hover:bg-sky-500 hover:text-white transition-colors">
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {variant === "vertical" && courses.length > 3 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-block px-4 py-2 border border-primary-500 text-primary-500 rounded-md hover:bg-primary-50 transition-colors font-semibold text-sm"
                    >
                        {isExpanded ? "Show Less" : "Show More"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Courses;