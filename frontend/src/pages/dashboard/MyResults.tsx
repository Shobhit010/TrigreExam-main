import React from "react";
import { useNavigate } from "react-router-dom";

const MyResults: React.FC = () => {
    const navigate = useNavigate();
    // Mock data matching your screenshot
    const testResults = [
        {
            id: 1,
            name: "Organic Reactions - 07-09-2025",
            correct: 45,
            incorrect: 5,
            maxScore: 180,
            yourScore: 175,
            bonusMarks: "",
            percentage: "97.22%",
            rank: 12,
            totalRank: 780,
            accuracy: "90.00%",
            percentile: "98.46%",
            attempted: 50,
            totalQuestions: 54
        },
        {
            id: 2,
            name: "Inorganic Chemistry Quiz - 12-10-2025",
            correct: 38,
            incorrect: 12,
            maxScore: 200,
            yourScore: 140,
            bonusMarks: "",
            percentage: "70.00%",
            rank: 156,
            totalRank: 850,
            accuracy: "76.00%",
            percentile: "81.65%",
            attempted: 50,
            totalQuestions: 60
        },
        {
            id: 3,
            name: "Physics Mock Test - 15-11-2025",
            correct: 25,
            incorrect: 15,
            maxScore: 300,
            yourScore: 85,
            bonusMarks: "5",
            percentage: "28.33%",
            rank: 450,
            totalRank: 500,
            accuracy: "62.50%",
            percentile: "10.00%",
            attempted: 40,
            totalQuestions: 75
        },
    ];

    return (
        <div className="bg-[#f8f9fa] min-h-screen font-sans antialiased">
            <div className="max-w-[1600px] mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-[25px] gap-[15px]">
                    <div>
                        <h2 className="text-xl font-bold text-black dark:text-white mb-1">
                            My Results
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Detailed breakdown of your test performance and progress.
                        </p>
                    </div>
                </div>

                {/* Main Performance Content */}
                <div className="px-6 md:px-16 lg:px-32">
                    <div className="flex flex-col gap-8">
                        {/* Performance Summary Section */}
                        <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="bg-white border border-gray-100 rounded-xl px-6 flex items-center justify-between gap-4 min-h-[84px]">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 flex items-center justify-center bg-blue-50 rounded-2xl border border-blue-100 overflow-hidden p-2 shadow-sm shrink-0">
                                        <img
                                            src="/images/diagram.png"
                                            alt="Performance Icon"
                                            className="w-full h-full object-contain"
                                            style={{ filter: 'invert(12%) sepia(95%) saturate(3954%) hue-rotate(224deg) brightness(85%) contrast(117%)' }}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h4 className="text-xl font-bold text-[#2d3748] m-0">Performance Summary</h4>
                                        <p className="text-xs text-gray-500 font-medium m-0">Quick overview of your total activity</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center md:text-right border-l md:border-l-0 md:pl-0 pl-6 border-gray-100">
                                        <span className="block text-2xl font-black text-blue-600 leading-none">{testResults.length}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Tests Attempted</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Test-wise Performance Section */}
                        <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="bg-white border border-gray-100 rounded-xl px-6 flex items-center justify-between gap-4 mb-4 min-h-[70px]">
                                <h4 className="text-xl font-bold text-[#2d3748] m-0 mt-3">Test-wise Performance Summary</h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-extrabold text-blue-600 bg-white border border-blue-100 px-4 py-2 rounded-lg shadow-sm shrink-0">
                                        Total Attempted: {testResults.length}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {testResults.map((test) => (
                                    <div key={test.id} className="group bg-white rounded-xl py-2 px-4 shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-0.5 w-full flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-xl"></div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                                                <img src="/images/paper2.png" alt="Test Icon" className="w-6 h-6 object-contain" />
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="!text-[16px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-0.5">{test.name}</h5>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                                                    <span>Score: {test.yourScore}/{test.maxScore}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span>Accuracy: {test.accuracy}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-[3.5rem] md:pl-0">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <i className="material-symbols-outlined text-[14px]">leaderboard</i>
                                                <span>Rank: {test.rank}/{test.totalRank}</span>
                                            </div>
                                            <button
                                                onClick={() => navigate("/my-results/test-report", { state: { testData: test } })}
                                                className="bg-white border border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 shadow-sm group-hover:shadow-blue-200 hover:scale-105 active:scale-95 uppercase tracking-wider"
                                            >
                                                Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyResults;