import React from "react";
import { Link } from "react-router-dom";

const CARD_THEME = {
  title:
    "text-[15px] font-semibold leading-tight line-clamp-2 hover:text-primary-500 transition-colors cursor-pointer",
  button:
    "mt-[10px] block w-full text-center py-[6px] rounded-md border font-medium transition-all text-sm",
};

// Helper function to get random image
const getRandomImage = () => {
  const images = ["/images/cat.webp", "/images/upsc.webp", "/images/ssc.png"];
  return images[Math.floor(Math.random() * images.length)];
};

const courses = [
  {
    id: 1,
    title:
      "Foundation Program for Competitive Exams (Comprehensive Preparation Course)",
    type: "Video Course",
    progress: 30,
    totalLessons: 5,
    completedLessons: 5,
    totalVideos: 4,
    totalTests: 3,
    expiryDate: "1 Year",
  },
  {
    id: 2,
    title: "Quantitative Aptitude – Advanced Mastery Program",
    type: "Video Course",
    progress: 0,
    totalLessons: 5,
    completedLessons: 0,
    totalVideos: 10,
    totalTests: 3,
    expiryDate: "1 Year",
  },
  {
    id: 3,
    title: "Reasoning & General Intelligence – Complete Course",
    type: "Video Course",
    progress: 50,
    totalLessons: 5,
    completedLessons: 0,
    totalVideos: 10,
    totalTests: 3,
    expiryDate: "1 Year",
  },
  {
    id: 4,
    title: "English Language – Professional Skills Program",
    type: "Video Course",
    progress: 0,
    totalLessons: 5,
    completedLessons: 0,
    totalVideos: 10,
    totalTests: 3,
    expiryDate: "1 Year",
  },
  {
    id: 5,
    title: "General ",
    type: "Test Course",
    progress: 5,
    totalLessons: 5,
    completedLessons: 5,
    totalVideos: 10,
    totalTests: 3,
    expiryDate: "1 Year",
  },
  {
    id: 6,
    title: "Mathematics – Booster & Speed Enhancement Course",
    type: "Test Course",
    progress: 90,
    totalLessons: 5,
    completedLessons: 0,
    totalVideos: 10,
    totalTests: 4,
    expiryDate: "1 Year",
  },
];

/* ================================
   🧩 COMPONENT
================================ */
const MyCourses: React.FC = () => {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-[25px] gap-[15px]">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white mb-1">
            My Courses
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Pick up where you left off.
          </p>
        </div>

        <div className="relative">
          <i className="material-symbols-outlined absolute left-[15px] top-1/2 -translate-y-1/2 text-gray-400">
            search
          </i>
          <input
            type="text"
            placeholder="Search your courses..."
            className="bg-white dark:bg-[#0c1427] h-[45px] rounded-md outline-none pl-[45px] pr-[20px] w-full md:w-[300px] border border-gray-100 dark:border-[#172036] focus:border-primary-500 transition-all text-black dark:text-white"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px] justify-items-center max-w-fit mx-auto">
        {courses.map((course) => {
          return (
            <div
              key={course.id}
              className="w-[330px] h-[350px] bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#172036] overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Image / Banner */}
              <div
                className={`h-[130px] w-full bg-gray-100 dark:bg-[#172036] flex items-center justify-center relative group overflow-hidden`}
              >
                <img
                  src={getRandomImage()}
                  alt={course.title}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={
                      course.type === "Video Course"
                        ? "/lms/video-course-player"
                        : course.type === "Test Course"
                          ? "/lms/test-course-details"
                          : "#"
                    }
                    state={{ title: course.title, type: course.type, courseData: course }}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-900 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <i className="material-symbols-outlined text-[20px]">
                      play_arrow
                    </i>
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="p-[12px] flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${course.type === "Video Course"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}
                  >
                    {course.type}
                  </span>
                </div>
                <h3
                  className={`${CARD_THEME.title} text-black dark:text-white mb-[8px] !text-[15px]`}
                  style={{ fontSize: "15px", lineHeight: "1.4" }}
                >
                  {course.title}
                </h3>

                <div className="mb-[10px]">
                  <div className="flex flex-nowrap justify-between gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                      <img
                        src="/images/play.png"
                        alt="play"
                        className="w-[13px] h-[13px] object-contain opacity-60"
                      />
                      <span>Total Videos: {course.totalVideos}</span>
                    </div>
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                      <img
                        src="/images/paper2.png"
                        alt="tests"
                        className="w-[13px] h-[13px] object-contain"
                      />
                      <span>Total Tests: {course.totalTests}</span>
                    </div>
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                      <img
                        src="/images/schedule.png"
                        alt="calendar"
                        className="w-[13px] h-[13px] object-contain opacity-60"
                      />
                      <span>Validity: {course.expiryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-[8px]">
                    <span>{course.progress}% Completed</span>
                    <span>
                      {course.completedLessons}/{course.totalLessons} Lessons
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 dark:bg-[#172036] rounded-full h-[6px] overflow-hidden">
                    <div
                      className="bg-primary-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>

                  <Link
                    to={
                      course.type === "Video Course"
                        ? "/lms/video-course-player"
                        : course.type === "Test Course"
                          ? "/lms/test-course-details"
                          : "#"
                    }
                    state={{ title: course.title, type: course.type, courseData: course }}
                    className="mt-[12px] flex items-center justify-center gap-2 w-full py-[10px] rounded-lg font-semibold text-sm bg-white dark:bg-[#0c1427] border-2 border-primary-500 text-primary-500 shadow-sm hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 hover:text-white hover:border-transparent hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {course.progress === 0 ? (
                      <>
                        <i className="material-symbols-outlined text-[18px]">play_arrow</i>
                        <span>Start Course</span>
                      </>
                    ) : (
                      <>
                        <i className="material-symbols-outlined text-[18px]">school</i>
                        <span>Continue Learning</span>
                      </>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MyCourses;