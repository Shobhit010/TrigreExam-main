import React, { useState } from "react";
import { useLocation } from "react-router-dom";

interface SectionData {
    name: string;
    score: number;
    attempted: number;
    correct: number;
    incorrect: number;
    time: string;
}

interface TopperComparisonData {
    score: string;
    scoreRatio: number; // 0 to 1 for progress bar
    accuracy: string;
    accuracyRatio: number;
    correct: string;
    correctRatio: number;
    wrong: string;
    wrongRatio: number;
    time: string;
    timeRatio: number;
}

const CircularProgress: React.FC<{
    value: number;
    max: number;
    label: string;
    subLabel: string;
    color: string;
    size?: number;
}> = ({ value, max, label, subLabel, color, size = 120 }) => {
    const [progress, setProgress] = useState(value / max);
    const [isAnimating, setIsAnimating] = useState(true);
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;

    const handleMouseEnter = () => {
        setIsAnimating(false);
        setProgress(0);
        setTimeout(() => {
            setIsAnimating(true);
            setProgress(value / max);
        }, 50);
    };

    const offset = circumference - progress * circumference;

    return (
        <div
            className="flex flex-col items-center cursor-help group"
            onMouseEnter={handleMouseEnter}
        >
            <div className="relative group-hover:scale-105 transition-transform duration-300" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e5e7eb"
                        strokeWidth="10"
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        style={{
                            strokeDashoffset: isNaN(offset) ? circumference : offset,
                            transition: isAnimating ? "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
                            strokeLinecap: "round"
                        }}
                    />
                </svg>
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[14px] md:text-[16px] font-bold text-gray-800 leading-tight group-hover:text-primary-600 transition-colors uppercase">{label}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{subLabel}</span>
                </div>
            </div>
            {/* Tooltip hint */}
            <span className="mt-2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Hover to replay</span>
        </div>
    );
};

const TestReport: React.FC = () => {
    const location = useLocation();
    const testData = location.state?.testData || {
        name: "Class 11th JEE Advanced (Paper 01) - 07-09-25",
        yourScore: 6,
        maxScore: 180,
        rank: 373,
        totalRank: 780,
        percentage: "3.33%",
        attempted: 1,
        totalQuestions: 54,
        accuracy: "100.00%",
        percentile: "25.15%"
    };

    const [activeTab, setActiveTab] = useState("Score Overview");

    const tabs = ["Score Overview", "Question Wise", "Compare with Topper", "Solution"];

    const sections: SectionData[] = [
        { name: "Phy Sec A", score: 0, attempted: 0, correct: 0, incorrect: 0, time: "0.00 Mins." },
        { name: "Phy Sec B", score: 0, attempted: 0, correct: 0, incorrect: 0, time: "0.00 Mins." },
        { name: "Phy Sec C", score: 0, attempted: 0, correct: 0, incorrect: 0, time: "0.00 Mins." },
    ];

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans">
            {/* The Margin Wrapper:
                max-w-[1600px] centers content on ultra-wide screens.
                px-6 (mobile), px-16 (tablet), px-32 (desktop) adds the side margins.
            */}
            <div className="max-w-[1600px] mx-auto px-6 md:px-16 lg:px-32 py-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-xl md:text-2xl font-medium text-gray-800">
                        Test Report of {testData.name}
                    </h3>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded text-[13px] font-bold transition-all duration-200 shadow-sm ${activeTab === tab
                                ? "bg-blue-600 text-white"
                                : "bg-[#eee] text-[#444] hover:bg-[#e4e4e4]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Score Overview Panel */}
                {activeTab === "Score Overview" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

                        {/* Overall Performance Summary */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                            <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-8 border-l-4 border-blue-500 pl-4">
                                Overall Performance Summary
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
                                <CircularProgress
                                    value={testData.rank}
                                    max={testData.totalRank || 1000}
                                    label={`${testData.rank} / ${testData.totalRank || 780}`}
                                    subLabel="Rank"
                                    color="#f87171"
                                />
                                <CircularProgress
                                    value={testData.yourScore}
                                    max={testData.maxScore}
                                    label={`${testData.yourScore} / ${testData.maxScore}`}
                                    subLabel="Score"
                                    color="#2dd4bf"
                                />
                                <CircularProgress
                                    value={testData.attempted}
                                    max={testData.totalQuestions || 54}
                                    label={`${testData.attempted} / ${testData.totalQuestions || 54}`}
                                    subLabel="Attempted"
                                    color="#60a5fa"
                                />
                                <CircularProgress
                                    value={parseFloat(testData.accuracy)}
                                    max={100}
                                    label={testData.accuracy}
                                    subLabel="Accuracy"
                                    color="#f472b6"
                                />
                                <CircularProgress
                                    value={parseFloat(testData.percentile)}
                                    max={100}
                                    label={testData.percentile}
                                    subLabel="Percentile"
                                    color="#fbbf24"
                                />
                            </div>
                        </div>

                        {/* Section-wise Performance */}
                        <div>
                            <h4 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-4">
                                Section-wise Performance
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sections.map((section) => (
                                    <div key={section.name} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                            <span className="font-bold text-gray-700 text-sm">{section.name}</span>
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                <span className="font-mono">{section.time}</span>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            {[
                                                { label: "Score :", value: section.score, color: "text-gray-900" },
                                                { label: "Attempted :", value: section.attempted, color: "text-gray-900" },
                                                { label: "Correct :", value: section.correct, color: "text-green-600" },
                                                { label: "Incorrect :", value: section.incorrect, color: "text-red-500" },
                                            ].map((item) => (
                                                <div key={item.label} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500 font-medium">{item.label}</span>
                                                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Compare with Topper */}
                        <CompareWithTopper />


                    </div>
                )}

                {/* Question Wise Tab */}
                {activeTab === "Question Wise" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <QuestionWise totalQuestions={testData.totalQuestions || 54} />
                    </div>
                )}

                {/* Compare with Topper Tab */}
                {activeTab === "Compare with Topper" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <OurToppers />
                    </div>
                )}

                {/* Solution Tab */}
                {activeTab === "Solution" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Solutions totalQuestions={testData.totalQuestions || 54} />
                    </div>
                )}
            </div>
        </div>
    );
};

const CompareWithTopper: React.FC = () => {
    const [activeSection, setActiveSection] = useState("Overall");
    const sections = ["Overall", "Physical", "Organic", "Inorganic"];

    const comparisonData: Record<string, { you: TopperComparisonData, topper: TopperComparisonData, avg: TopperComparisonData }> = {
        "Overall": {
            you: { score: "44 / 80", scoreRatio: 0.55, accuracy: "59.46%", accuracyRatio: 0.59, correct: "44 / 80", correctRatio: 0.55, wrong: "30 / 80", wrongRatio: 0.37, time: "114:20 / 120mins", timeRatio: 0.95 },
            topper: { score: "78 / 80", scoreRatio: 0.97, accuracy: "97.5%", accuracyRatio: 0.97, correct: "78 / 80", correctRatio: 0.97, wrong: "2 / 80", wrongRatio: 0.02, time: "77:16 / 120mins", timeRatio: 0.64 },
            avg: { score: "32.07 / 80", scoreRatio: 0.40, accuracy: "61.12%", accuracyRatio: 0.61, correct: "32 / 80", correctRatio: 0.40, wrong: "19 / 80", wrongRatio: 0.23, time: "63:35 / 120mins", timeRatio: 0.53 },
        }
    };

    const currentData = comparisonData[activeSection] || comparisonData["Overall"];

    return (
        <div className="mt-12">
            <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 font-display">Compare with topper</h4>

            {/* Internal Tabs */}
            <div className="flex flex-wrap gap-8 mb-4 border-b border-gray-100 pb-4">
                {sections.map(section => (
                    <button
                        key={section}
                        onClick={() => setActiveSection(section)}
                        className={`text-[15px] font-medium transition-all relative pb-4 ${activeSection === section
                            ? "text-blue-500"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {section}
                        {activeSection === section && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="py-6 px-6 bg-gray-50/30 w-[140px]"></th>
                            {["Score", "Accuracy", "Correct", "Wrong", "Time"].map(header => (
                                <th key={header} className="py-6 px-4 text-left text-gray-400 font-medium text-[13px] tracking-wide">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* You Row */}
                        <tr className="border-b border-gray-100 group transition-colors hover:bg-gray-50/20">
                            <td className="py-8 px-6 font-bold text-gray-800 text-[16px] bg-gray-50/10">You</td>
                            <ComparisonCell data={currentData.you.score} ratio={currentData.you.scoreRatio} color="purple" />
                            <ComparisonCell data={currentData.you.accuracy} ratio={currentData.you.accuracyRatio} color="green" />
                            <ComparisonCell data={currentData.you.correct} ratio={currentData.you.correctRatio} color="green" />
                            <ComparisonCell data={currentData.you.wrong} ratio={currentData.you.wrongRatio} color="red" />
                            <ComparisonCell data={currentData.you.time} ratio={currentData.you.timeRatio} color="yellow" />
                        </tr>
                        {/* Topper Row */}
                        <tr className="border-b border-gray-100 group transition-colors hover:bg-gray-50/20">
                            <td className="py-8 px-6 font-bold text-gray-800 text-[16px] bg-gray-50/10">Topper</td>
                            <ComparisonCell data={currentData.topper.score} ratio={currentData.topper.scoreRatio} color="purple" isTopper />
                            <ComparisonCell data={currentData.topper.accuracy} ratio={currentData.topper.accuracyRatio} color="green" isTopper />
                            <ComparisonCell data={currentData.topper.correct} ratio={currentData.topper.correctRatio} color="green" isTopper />
                            <ComparisonCell data={currentData.topper.wrong} ratio={currentData.topper.wrongRatio} color="red" isTopper />
                            <ComparisonCell data={currentData.topper.time} ratio={currentData.topper.timeRatio} color="yellow" isTopper />
                        </tr>
                        {/* Avg Row */}
                        <tr className="group transition-colors hover:bg-gray-50/20">
                            <td className="py-8 px-6 font-bold text-gray-800 text-[16px] bg-gray-50/10">Avg</td>
                            <ComparisonCell data={currentData.avg.score} ratio={currentData.avg.scoreRatio} color="purple" />
                            <ComparisonCell data={currentData.avg.accuracy} ratio={currentData.avg.accuracyRatio} color="green" />
                            <ComparisonCell data={currentData.avg.correct} ratio={currentData.avg.correctRatio} color="green" />
                            <ComparisonCell data={currentData.avg.wrong} ratio={currentData.avg.wrongRatio} color="red" />
                            <ComparisonCell data={currentData.avg.time} ratio={currentData.avg.timeRatio} color="yellow" />
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const OurToppers: React.FC = () => {
    // ... (keep existing toppers data)
    const toppers = [
        { name: "Samridhi Talwar", rank: "AIR 1", exam: "Delhi Judicial 2024" },
        { name: "Ashish Tiwari", rank: "AIR 2", exam: "SSC CGL 2024" },
        { name: "Debesh Bairagi", rank: "AIR 4", exam: "SSC CGL 2024" },
        { name: "Ishant Shukla", rank: "AIR 8", exam: "SSC CGL 2024" },
        { name: "Rohit Chadhar", rank: "AIR 1", exam: "SSC CHSL 2024" },
        { name: "Sagardip Ghosh", rank: "AIR 3", exam: "SSC CHSL 2024" },
        { name: "Mohan Kumar", rank: "AIR 1", exam: "SSC JE (ME) 2023" },
        { name: "Sanket Paul", rank: "AIR 1", exam: "SSC JE (CE) 2023" },
    ];

    return (
        <div className="mt-20 mb-12">
            <div className="text-center mb-12">
                <h4 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
                    <span className="text-blue-500">Our</span> Toppers
                </h4>
                <div className="h-1 w-16 bg-blue-500 mx-auto mt-2 rounded-full opacity-30" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                {toppers.map((topper, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col items-center group hover:shadow-[0_15px_50px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1"
                    >
                        {/* ... (keep existing card content) ... */}
                        <div className="relative mb-6">
                            <div className="absolute -inset-4 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
                                <div className="absolute top-2 -left-2 w-2 h-2 rounded-full bg-blue-300" />
                                <div className="absolute bottom-4 -right-1 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                <div className="absolute top-8 -right-3 w-3 h-1 bg-yellow-400 rounded-full rotate-45" />
                                <div className="absolute -bottom-1 left-4 w-3 h-1 bg-purple-400 rounded-full -rotate-12" />
                            </div>

                            <div className="w-24 h-24 rounded-full border-4 border-yellow-400/80 p-1 bg-white relative z-10">
                                <div className="w-full h-full rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 overflow-hidden">
                                    <i className="material-symbols-outlined !text-[70px]">account_circle</i>
                                </div>
                                <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    <i className="material-symbols-outlined !text-[16px] text-white">grade</i>
                                </div>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div className="flex gap-0.5 items-end h-3">
                                        <div className="w-1 bg-yellow-400 h-1.5 rounded-t-sm" />
                                        <div className="w-1 bg-yellow-400 h-3 rounded-t-sm" />
                                        <div className="w-1 bg-yellow-400 h-2 rounded-t-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h5 className="text-[17px] font-bold text-gray-800 mb-1.5 text-center group-hover:text-blue-600 transition-colors">{topper.name}</h5>
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[13px] font-extrabold text-green-600 uppercase tracking-wide">{topper.rank}</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">| {topper.exam}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuestionWise: React.FC<{ totalQuestions: number }> = ({ totalQuestions }) => {
    // Generate demo data capped at 20 questions
    const questionData = Array.from({ length: Math.min(totalQuestions, 20) }, (_, i) => ({
        id: i + 1,
        correctAns: ["a", "b", "c", "d"][Math.floor(Math.random() * 4)],
        yourAns: i === 18 || i === 25 ? ["a", "b", "c", "d"][Math.floor(Math.random() * 4)] : "",
        timeTaken: i === 25 ? 21 : (i === 18 ? 1 : 0),
        status: i === 25 ? "Correct" : (i === 18 ? "Unattempted" : "Unseen")
    }));

    return (
        <div className="space-y-6">
            {/* Time Analytics Chart */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-700 text-[14px] border-l-[3px] border-blue-500 pl-2.5">Time Taken Per Question</span>
                    <span className="text-[11px] text-gray-400 font-medium">in seconds</span>
                </div>
                <div className="p-5 overflow-x-auto">
                    <div className="min-w-[700px] h-[200px] relative">
                        <div className="absolute left-0 inset-y-0 w-8 flex flex-col justify-between text-[10px] text-gray-400 pb-5">
                            {[20, 15, 10, 5, 0].map(val => (
                                <span key={val} className="text-right">{val}</span>
                            ))}
                        </div>
                        {/* Grid lines */}
                        <div className="absolute left-10 right-0 inset-y-0 flex flex-col justify-between pb-5 pointer-events-none">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="border-b border-gray-100 border-dashed" />
                            ))}
                        </div>
                        <div className="ml-10 h-full flex items-end gap-[3px] border-b border-gray-200 pb-0">
                            {questionData.map(q => (
                                <div key={q.id} className="flex-1 group relative flex flex-col items-center">
                                    <div
                                        className="w-full bg-blue-400 rounded-t-sm transition-all duration-300 hover:bg-blue-500 min-h-[1px]"
                                        style={{ height: q.timeTaken > 0 ? `${(q.timeTaken / 22) * 100}%` : '0%' }}
                                    >
                                        {q.timeTaken > 0 && (
                                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 shadow-sm">
                                                {q.timeTaken}s
                                            </div>
                                        )}
                                    </div>
                                    <span className="absolute -bottom-4 text-[8px] text-gray-400 font-medium">{q.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Details Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-gray-100">
                    <span className="font-semibold text-gray-700 text-[14px] border-l-[3px] border-blue-500 pl-2.5">Question Details</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-[11px] text-gray-400 uppercase tracking-wider border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold w-[60px]">Q. No</th>
                                <th className="px-5 py-3 font-semibold">Correct Ans</th>
                                <th className="px-5 py-3 font-semibold">Your Ans</th>
                                <th className="px-5 py-3 font-semibold">Time (Sec)</th>
                                <th className="px-5 py-3 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questionData.map((q, idx) => (
                                <tr key={q.id} className={`text-[13px] text-gray-600 transition-colors hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                                    <td className="px-5 py-2.5 font-semibold text-gray-700">{q.id}</td>
                                    <td className="px-5 py-2.5 uppercase font-medium">{q.correctAns}</td>
                                    <td className="px-5 py-2.5 uppercase font-medium">{q.yourAns || "—"}</td>
                                    <td className="px-5 py-2.5 font-mono text-[12px]">{q.timeTaken}</td>
                                    <td className="px-5 py-2.5 text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${q.status === 'Correct' ? 'bg-emerald-50 text-emerald-600' :
                                            q.status === 'Incorrect' ? 'bg-rose-50 text-rose-600' :
                                                'bg-gray-100 text-gray-400'
                                            }`}>
                                            {q.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};




const Solutions: React.FC<{ totalQuestions: number }> = () => {
    // State for active question and section
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [activeSection, setActiveSection] = useState("Physical");
    const [showSolution] = useState(true);

    // Mock Sections
    const sections = ["Physical", "Organic", "Inorganic"];

    // Generate more detailed mock data for the full experience
    const questions = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        question: `If the average of 5 numbers is 20, and one number is removed, the average becomes 18. What is the removed number?`,
        briefExplanation: "The sum of 5 numbers is 20 * 5 = 100. The sum of 4 numbers is 18 * 4 = 72. The removed number is 100 - 72 = 28.",
        options: [
            { id: "a", text: "28" },
            { id: "b", text: "30" },
            { id: "c", text: "26" },
            { id: "d", text: "32" }
        ],
        correctOption: "a",
        userSelectedOption: i % 3 === 0 ? "a" : i % 3 === 1 ? "b" : null, // Mock user selection
        status: i % 3 === 0 ? "Correct" : i % 3 === 1 ? "Incorrect" : "Unattempted",
        marks: i % 3 === 0 ? 1 : 0,
        timeTaken: "02:25",
        avgTime: "02:13",
        accuracy: "57%",
        explanation: "Sum of 5 numbers = 20 * 5 = 100. Sum of 4 numbers = 18 * 4 = 72. Removed number = 100 - 72 = 28."
    }));

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[580px]">
            {/* Left Main Content Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">


                {/* Question Header Info */}
                <div className="flex items-center px-6 py-4 border-b border-gray-100 bg-white gap-4 flex-wrap">
                    {/* Question Number */}
                    <span className="font-extrabold text-gray-800 text-[16px]">Question No.{currentQuestion.id}</span>

                    <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold capitalize flex items-center justify-center min-w-[80px] border ${currentQuestion.status === "Correct" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        currentQuestion.status === "Incorrect" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                        {currentQuestion.status}
                    </span>

                    {/* Time Info */}
                    <div className="flex items-center gap-3 text-[14px] text-gray-600 font-medium">
                        <i className={`material-symbols-outlined !text-[20px] ${currentQuestion.status === "Correct" ? "text-emerald-500" :
                            currentQuestion.status === "Incorrect" ? "text-rose-500" : "text-gray-400"
                            }`}>timer</i>
                        <span>You: <span className="text-gray-800">{currentQuestion.timeTaken}</span></span>
                        <span className="text-gray-400">Avg: {currentQuestion.avgTime}</span>
                    </div>

                    <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                    {/* Marks */}
                    <div className="flex items-center gap-2 text-[14px] text-gray-800 font-medium">
                        <span>Marks</span>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentQuestion.marks > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                            }`}>
                            {currentQuestion.marks}
                        </span>
                    </div>



                </div>

                {/* Question & Options Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-white relative">
                    <div className="max-w-4xl mx-auto">
                        {/* Question Text */}
                        <div className="mb-8">
                            <h6 className="text-[16px] md:text-[18px] text-gray-800 font-medium leading-relaxed">
                                {currentQuestion.question}
                            </h6>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 mb-8">
                            {currentQuestion.options.map((opt) => {
                                const isSelected = currentQuestion.userSelectedOption === opt.id;
                                const isCorrect = currentQuestion.correctOption === opt.id;
                                const isUserWrong = isSelected && !isCorrect;

                                let borderClass = "border-gray-200 hover:bg-gray-50";

                                let icon = "radio_button_unchecked";
                                let iconColor = "text-gray-300";

                                if (showSolution || currentQuestion.status !== "Unattempted") {
                                    if (isCorrect) {
                                        borderClass = "border-emerald-500 bg-emerald-50/50";
                                        icon = "check_circle";
                                        iconColor = "text-emerald-500";
                                    } else if (isUserWrong) {
                                        borderClass = "border-rose-500 bg-rose-50/50";
                                        icon = "cancel";
                                        iconColor = "text-rose-500";
                                    }
                                }

                                return (
                                    <div
                                        key={opt.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-default ${borderClass}`}
                                    >
                                        <i className={`material-symbols-outlined ${iconColor}`}>{icon}</i>
                                        <span className="font-medium text-gray-700">{opt.text}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Navigation Buttons (Middle) */}
                        <div className="flex justify-between items-center mb-6">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="material-symbols-outlined text-[18px]">arrow_back</i>
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <i className="material-symbols-outlined text-[18px]">arrow_forward</i>
                            </button>
                        </div>

                        {/* Solution Section */}
                        {showSolution && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-6">
                                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-[14px]">S</span>
                                        Solution
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed text-[14px]">
                                        {currentQuestion.explanation}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </div>

            {/* Right Sidebar - Palette */}
            <div className="w-full lg:w-[320px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                {/* Section Selector */}
                <div className="px-4 pt-4 pb-0">
                    <h6 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</h6>
                    <div className="flex gap-1 border-b border-gray-100">
                        {sections.map(section => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`flex-1 py-2.5 text-[12px] font-semibold transition-all relative ${activeSection === section
                                    ? "text-blue-600"
                                    : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                {section}
                                {activeSection === section && (
                                    <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="flex items-center justify-center gap-4 px-4 py-3 border-b border-gray-100 text-[11px]">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-gray-600">9 Correct</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="font-medium text-gray-600">11 Wrong</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="font-medium text-gray-600">6 Skipped</span>
                    </div>
                </div>

                {/* Questions Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-700 text-[13px] border-l-[3px] border-blue-500 pl-2.5">{activeSection}</span>
                    <span className="text-[11px] text-gray-400 font-medium">{questions.length} Questions</span>
                </div>

                {/* Question Grid */}
                <div className="flex-1 overflow-y-auto p-4 content-start">
                    <div className="flex flex-wrap gap-2.5 justify-center">
                        {questions.map((q, idx) => {
                            let bgClass = "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100";
                            const isActive = idx === currentQuestionIndex;

                            if (q.status === "Correct") bgClass = "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600";
                            else if (q.status === "Incorrect") bgClass = "bg-rose-500 text-white border-rose-500 hover:bg-rose-600";

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`w-12 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold border transition-all duration-150 ${bgClass} ${isActive ? 'ring-2 ring-offset-1 ring-blue-500 scale-105' : ''
                                        }`}
                                >
                                    {q.id}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-gray-100 flex gap-2">
                    <button className="flex-1 py-2 text-blue-600 border border-blue-200 bg-blue-50/50 rounded-lg text-[11px] font-semibold hover:bg-blue-100 transition-colors">
                        Question Paper
                    </button>
                    <button className="flex-1 py-2 text-blue-600 border border-blue-200 bg-blue-50/50 rounded-lg text-[11px] font-semibold hover:bg-blue-100 transition-colors">
                        Summary
                    </button>
                </div>
            </div>
        </div>
    );
};

const ComparisonCell: React.FC<{ data: string, ratio: number, color: string, isTopper?: boolean }> = ({ data, ratio, color, isTopper }) => {
    const colorMap: Record<string, string> = {
        purple: isTopper ? "bg-purple-100/60 border-purple-500" : "bg-purple-100/40 border-purple-400",
        green: isTopper ? "bg-green-50/70 border-green-500" : "bg-green-50/40 border-green-400",
        red: isTopper ? "bg-red-50/70 border-red-500" : "bg-red-50/40 border-red-400",
        yellow: isTopper ? "bg-yellow-50/70 border-yellow-500" : "bg-yellow-50/40 border-yellow-400"
    };

    const [val, max] = data.includes("/") ? data.split("/").map(s => s.trim()) : [data, ""];

    return (
        <td className="py-4 px-4 border-r border-gray-50 last:border-r-0 relative min-w-[160px]">
            {/* Background progress */}
            <div
                className={`absolute inset-y-2 left-0 pointer-events-none transition-all duration-1000 ease-out border-r-[3px] ${colorMap[color]}`}
                style={{ width: `${ratio * 100}%` }}
            />
            {/* Text content */}
            <div className="relative z-10 font-bold text-[15px] text-gray-900">
                {val}
                {max && <span className="text-gray-300 font-normal ml-1">/ {max}</span>}
            </div>
        </td>
    );
};

export default TestReport;