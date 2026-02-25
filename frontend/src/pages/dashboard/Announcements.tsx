import React, { useState } from "react";

interface Announcement {
    id: number;
    title: string;
    description: string;
    detailedContent: string;
    category: "Exam Update" | "Content" | "System";
    status: "New" | "Important" | "Resolved";
    time: string;
    isNew?: boolean;
    pdfUrl?: string;
}

const Announcements: React.FC = () => {

    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<Announcement | null>(null);

    const announcements: Announcement[] = [
        {
            id: 1,
            title: "SSC CGL 2024 Exam Dates Announced",
            description:
                "The Staff Selection Commission has officially released the tentative schedule for the Tier-I examination.",
            detailedContent: `The Staff Selection Commission (SSC) has officially announced the exam dates for SSC CGL 2024. The Tier-I examination is scheduled from March 15 to March 30, 2024.

Key Highlights:

• Tier-I Exam: March 15-30, 2024  
• Tier-II Exam: Expected in June 2024  
• Total Vacancies: 17,727 posts  
• Application Deadline: February 28, 2024  

Candidates are advised to start their preparation immediately and ensure all documents are ready.

For detailed information, please refer to the official notification attached below.`,
            category: "Exam Update",
            status: "New",
            time: "2h ago",
            isNew: true,
            pdfUrl: "/pdfs/ssc-cgl-2024-notification.pdf",
        },
        {
            id: 2,
            title: "New Quantitative Aptitude Module Added",
            description:
                "We have updated the Advanced Mastery Program with 20 new lessons on Trigonometry and Geometry shortcuts.",
            detailedContent: `New Quantitative Aptitude Module Added!

• 20 new lessons  
• 150+ practice questions  
• 5 new mock tests  
• Downloadable formula sheets`,
            category: "Content",
            status: "New",
            time: "5h ago",
            isNew: true,
            pdfUrl: "/pdfs/quant-module-syllabus.pdf",
        },
        {
            id: 3,
            title: "Scheduled System Maintenance",
            description:
                "The platform will be undergoing scheduled maintenance on Sunday from 2 AM to 4 AM.",
            detailedContent: `Maintenance Schedule:

• Sunday  
• 2 AM - 4 AM IST  

Platform will be temporarily unavailable during this time.`,
            category: "System",
            status: "Important",
            time: "1d ago",
        },
        {
            id: 4,
            title: "Tier-II Mock Test Results Live",
            description:
                "Results for the All India Mock Test held on Saturday are now available.",
            detailedContent: `Mock test results are now live with detailed analysis.`,
            category: "Exam Update",
            status: "Resolved",
            time: "2d ago",
            pdfUrl: "/pdfs/mock-test-analysis.pdf",
        },
        {
            id: 5,
            title: "New History Course Available",
            description:
                "Comprehensive Indian History course covering Ancient, Medieval, and Modern periods now available.",
            detailedContent: `100+ lectures with MCQs and topic-wise tests.`,
            category: "Content",
            status: "New",
            time: "3d ago",
            isNew: true,
            pdfUrl: "/pdfs/history-course-brochure.pdf",
        },
    ];

    const getCategoryColor = (category: Announcement["category"]) => {
        switch (category) {
            case "Exam Update":
                return "bg-primary-50 text-primary-600 border-primary-100";
            case "Content":
                return "bg-purple-50 text-purple-600 border-purple-100";
            case "System":
                return "bg-orange-50 text-orange-600 border-orange-100";
            default:
                return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const getStatusColor = (status: Announcement["status"]) => {
        switch (status) {
            case "New":
                return "bg-red-500 text-white";
            case "Important":
                return "bg-amber-500 text-white";
            case "Resolved":
                return "bg-green-500 text-white";
            default:
                return "bg-gray-500 text-white";
        }
    };

    const getCategoryIcon = (category: Announcement["category"]) => {
        switch (category) {
            case "Exam Update":
                return "event_note";
            case "Content":
                return "school";
            case "System":
                return "settings";
            default:
                return "notifications";
        }
    };

    return (
        <>
            {/* ================= FRONT TIMELINE (UNCHANGED) ================= */}
            {/* Header - Aligned Left */}
            <div className="max-w-[1600px] mx-auto px-6 mb-[20px]">
                <h2 className="text-xl font-bold text-black dark:text-white mb-1">
                    Announcements
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Stay updated with the latest news and platform updates.
                </p>
            </div>

            {/* Timeline container */}
            <div className="max-w-[1600px] mx-auto px-6 md:px-16 lg:px-32 pb-[60px]">
                <div className="relative">
                    <div className="absolute left-[18px] md:left-[20px] top-[4px] bottom-[4px] w-[2px] bg-gray-200 dark:bg-[#172036]" />

                    <div className="flex flex-col gap-[24px]">
                        {announcements.map((item, index) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedAnnouncement(item)}
                                className="relative flex gap-[16px] md:gap-[24px] group cursor-pointer"
                            >
                                {/* Timeline Dot */}
                                <div className="relative z-10 flex-shrink-0 w-[38px] md:w-[42px] flex justify-center pt-[14px] md:pt-[16px]">
                                    {/* Line Mask for Last Item */}
                                    {index === announcements.length - 1 && (
                                        <div className="absolute top-[28px] md:top-[32px] bottom-0 w-[4px] bg-gray-50 dark:bg-[#0a0e19] -z-10" />
                                    )}

                                    <span className="flex items-center justify-center w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full bg-white dark:bg-[#0c1427] shadow-[0_1px_6px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-[#172036] group-hover:border-primary-500 group-hover:shadow-md transition-all duration-300">
                                        <span
                                            className={`block w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-full transition-colors duration-300 ${index === 0
                                                ? "bg-primary-500"
                                                : "bg-gray-300 dark:bg-gray-500 group-hover:bg-primary-500"
                                                }`}
                                        />
                                    </span>
                                </div>

                                {/* Card */}
                                <div className="flex-1 trezo-card bg-white dark:bg-[#0c1427] py-[10px] px-[14px] md:py-[12px] md:px-[18px] rounded-xl border border-gray-100 dark:border-[#172036] group-hover:bg-gray-50 dark:group-hover:bg-[#15203c] group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-[8px]">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoryColor(item.category)}`}>
                                                {item.category}
                                            </span>
                                            {item.isNew && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-400 flex items-center gap-1">
                                            <i className="material-symbols-outlined text-[16px]">schedule</i>
                                            {item.time}
                                        </span>
                                    </div>

                                    <h5 className="text-[13px] font-bold text-black dark:text-white mb-[4px] group-hover:text-primary-600 transition-colors">
                                        {item.title}
                                    </h5>

                                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed max-w-4xl">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ================= INTERNAL PAGE (PREVIOUS PREMIUM DESIGN) ================= */}
            {
                selectedAnnouncement && (
                    <div className="fixed inset-0 bg-white dark:bg-[#0a0e19] z-50 overflow-y-auto">
                        <div className="min-h-screen">

                            {/* Header */}
                            <div className="sticky top-0 bg-white dark:bg-[#0a0e19] border-b border-gray-200 dark:border-[#172036] z-10">
                                <div className="max-w-5xl mx-auto px-6 py-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl ${getCategoryColor(selectedAnnouncement.category)} flex items-center justify-center`}>
                                                <i className="material-symbols-outlined text-[24px]">
                                                    {getCategoryIcon(selectedAnnouncement.category)}
                                                </i>
                                            </div>
                                            <div>
                                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getCategoryColor(selectedAnnouncement.category)}`}>
                                                    {selectedAnnouncement.category}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedAnnouncement(null)}
                                            className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-[#172036] flex items-center justify-center transition-colors"
                                        >
                                            <i className="material-symbols-outlined text-gray-500">close</i>
                                        </button>
                                    </div>

                                    <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
                                        {selectedAnnouncement.title}
                                    </h2>

                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <i className="material-symbols-outlined text-[16px]">schedule</i>
                                            {selectedAnnouncement.time}
                                        </span>
                                        {selectedAnnouncement.isNew && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedAnnouncement.status)}`}>
                                                {selectedAnnouncement.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="max-w-5xl mx-auto px-6 py-8">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-lg">
                                    {selectedAnnouncement.detailedContent}
                                </p>

                                {selectedAnnouncement.pdfUrl && (
                                    <div className="mt-8 p-6 bg-gray-50 dark:bg-[#0c1427] rounded-xl border border-gray-200 dark:border-[#172036] flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                                <i className="material-symbols-outlined text-red-600 dark:text-red-400 text-[32px]">
                                                    picture_as_pdf
                                                </i>
                                            </div>
                                            <div>
                                                <p className="font-bold text-black dark:text-white text-lg">
                                                    Official Document
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    PDF Attachment
                                                </p>
                                            </div>
                                        </div>

                                        <a
                                            href={selectedAnnouncement.pdfUrl}
                                            download
                                            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <i className="material-symbols-outlined text-[20px]">download</i>
                                            Download PDF
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Announcements;
