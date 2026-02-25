import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTestState, deleteTestState, isTestCompleted } from "../../utils/testStateManager";

const TestCourseDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { title, courseData } = location.state || {
        title: "Test Course",
        courseData: null
    };
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || "all-tests");
    const [testStates, setTestStates] = useState<Record<string, boolean>>({});
    const [openSeries, setOpenSeries] = useState<Record<number, boolean>>({ 1: true, 2: true });

    // Function to toggle series visibility
    const toggleSeries = (id: number) => {
        setOpenSeries(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Load test states on mount and when tab changes
    useEffect(() => {
        if (activeTab === "live-tests") {
            // Load completion status for all tests
            const states: Record<string, boolean> = {};
            const testCount = Math.min(courseData?.totalTests || 3, 5);
            for (let i = 0; i < testCount; i++) {
                const testId = `${title}-test-${i + 1}`;
                states[testId] = isTestCompleted(testId);
            }
            setTestStates(states);
        }
    }, [activeTab, title, courseData]);

    // Sync activeTab from location state when it changes
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    // Handler to start a test
    const handleStartTest = (testId: string, testTitle: string, questions: number, marks: number, minutes: number) => {
        navigate('/lms/test-instructions', {
            state: { testId, testTitle, questions, marks, minutes }
        });
    };

    // Handler to view test report
    const handleViewReport = (testId: string, testTitle: string) => {
        const state = getTestState(testId);
        navigate('/lms/test-result', {
            state: {
                testId,
                testTitle,
                score: state.score,
                total: state.total
            }
        });
    };

    // Handler to delete test report
    const handleDeleteReport = (testId: string) => {
        if (window.confirm('Are you sure you want to delete this test report? This action cannot be undone.')) {
            deleteTestState(testId);
            // Update local state
            setTestStates(prev => ({
                ...prev,
                [testId]: false
            }));
        }
    };

    return (
        <div className="bg-white dark:bg-[#0c1427] font-body flex flex-col h-full min-h-screen">
            <main className="flex-1 w-full px-6 py-8">
                {/* Title Section */}
                <div className="mb-6">
                    <h1 className="!text-[26px] font-bold text-gray-900 leading-tight">
                        {title}
                    </h1>
                    <div className="h-px w-full bg-gray-200"></div>
                </div>

                {/* Tabs */}
                {/* Centering Container */}
                <div className="flex justify-center w-full my-8">

                    {/* Your Button Group */}
                    <div className="flex flex-row items-center justify-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/50">
                        <button
                            onClick={() => setActiveTab("all-tests")}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "all-tests"
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                }`}
                        >
                            All Tests
                        </button>
                        <button
                            onClick={() => setActiveTab("live-tests")}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "live-tests"
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                }`}
                        >
                            Live Tests
                        </button>
                    </div>

                </div>

                {/* Content Area */}
                {
                    activeTab === "all-tests" && (
                        <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
                            {/* Series 1 */}
                            <div className="flex flex-col gap-2 bg-gray-50/80 p-6 rounded-3xl border border-gray-100">
                                <div
                                    onClick={() => toggleSeries(1)}
                                    className="cursor-pointer bg-white border border-blue-100 rounded-xl py-4 px-6 flex items-center justify-between gap-3 hover:bg-blue-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <img src="/images/checklist.png" alt="Series Icon" className="w-7 h-7 object-contain" />
                                        </div>
                                        <div className="flex flex-col justify-center min-h-[40px]">
                                            <h4 className="text-sm font-bold text-gray-800 leading-tight">{title} Test Series</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-extrabold text-blue-600 bg-white border border-blue-100 px-3 py-1 rounded shadow-sm">Total Tests: 3</span>
                                        <i className={`material-symbols-outlined text-gray-400 transition-transform ${openSeries[1] ? 'rotate-180' : ''}`}>expand_more</i>
                                    </div>
                                </div>

                                {openSeries[1] && (
                                    <div className="flex flex-col gap-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300 justify-start">
                                        {[
                                            { id: 1, title: 'General Test-01', questions: 150, marks: 600, minutes: 90, date: '04/02/2026 - 10/02/2026' },
                                            { id: 2, title: 'General Test-02', questions: 100, marks: 400, minutes: 120, date: '11/02/2026 - 17/02/2026' },
                                            { id: 3, title: 'General Test-03', questions: 200, marks: 800, minutes: 30, date: '18/03/2026 - 24/03/2026' }
                                        ].map((test) => (
                                            <div key={test.id} className="group bg-white rounded-xl py-2 px-4 shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-0.5 w-full flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-xl"></div>

                                                <div className="flex items-center gap-3 w-full md:w-auto">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                                                        <img src="/images/paper2.png" alt="Test Icon" className="w-6 h-6 object-contain" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="!text-[16px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-0.5">{test.title}</h5>
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                                                            <span>{test.questions} Questions</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span>{test.marks} Marks</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span>{test.minutes} Mins</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-[4rem] md:pl-0">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                        <i className="material-symbols-outlined text-[14px]">calendar_today</i>
                                                        <span>{test.date}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleStartTest(`${title}-t1-${test.id}`, test.title, test.questions, test.marks, test.minutes)}
                                                        className="bg-white border border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 shadow-sm group-hover:shadow-blue-200 hover:scale-105 active:scale-95 uppercase tracking-wider"
                                                    >
                                                        Start
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Series 2 */}
                            <div className="flex flex-col gap-2 bg-gray-50/80 p-6 rounded-3xl border border-gray-100">
                                <div
                                    onClick={() => toggleSeries(2)}
                                    className="cursor-pointer bg-white border border-blue-100 rounded-xl py-4 px-6 flex items-center justify-between gap-3 hover:bg-blue-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <img src="/images/checklist.png" alt="Series Icon" className="w-7 h-7 object-contain" />
                                        </div>
                                        <div className="flex flex-col justify-center min-h-[40px]">
                                            <h4 className="text-sm font-bold text-gray-800 leading-tight">{title} Practice Series</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-extrabold text-blue-600 bg-white border border-blue-100 px-3 py-1 rounded shadow-sm">Total Tests: 2</span>
                                        <i className={`material-symbols-outlined text-gray-400 transition-transform ${openSeries[2] ? 'rotate-180' : ''}`}>expand_more</i>
                                    </div>
                                </div>

                                {openSeries[2] && (
                                    <div className="flex flex-col gap-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {[
                                            { id: 4, title: 'Practice Test-01', questions: 50, marks: 200, minutes: 45, date: '12/11/2026 - 18/11/2026' },
                                            { id: 5, title: 'Practice Test-02', questions: 50, marks: 200, minutes: 45, date: '15/11/2026 - 21/11/2026' }
                                        ].map((test) => (
                                            <div key={test.id} className="group bg-white rounded-xl py-2 px-4 shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-0.5 w-full flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-xl"></div>

                                                <div className="flex items-center gap-3 w-full md:w-auto">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                                                        <img src="/images/paper2.png" alt="Test Icon" className="w-6 h-6 object-contain" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h6 className="!text-[16px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-0.5">{test.title}</h6>
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                                                            <span>{test.questions} Questions</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span>{test.marks} Marks</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span>{test.minutes} Mins</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-[4rem] md:pl-0">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                        <i className="material-symbols-outlined text-[14px]">calendar_today</i>
                                                        <span>{test.date}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleStartTest(`${title}-t2-${test.id}`, test.title, test.questions, test.marks, test.minutes)}
                                                        className="bg-white border border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 shadow-sm group-hover:shadow-blue-200 hover:scale-105 active:scale-95 uppercase tracking-wider"
                                                    >
                                                        Start
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === "live-tests" && (
                        <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
                            {(() => {
                                // Generate dynamic live tests
                                const liveTests = [];
                                const testCount = Math.min(courseData?.totalTests || 3, 5);

                                for (let i = 0; i < testCount; i++) {
                                    const testNumber = i + 1;
                                    const isLive = Math.random() > 0.5;
                                    const questions = [20, 50, 100, 150][Math.floor(Math.random() * 4)];
                                    const marks = questions * [2, 4, 5][Math.floor(Math.random() * 3)];
                                    const minutes = [12, 30, 60, 90, 120, 180][Math.floor(Math.random() * 6)];

                                    const startDay = Math.floor(Math.random() * 20) + 1;

                                    liveTests.push({
                                        id: testNumber,
                                        title: `${title.split(' ')[0]} - Live Test ${String(testNumber).padStart(2, '0')}`,
                                        questions,
                                        marks,
                                        minutes,
                                        isLive,
                                        type: testNumber % 3 === 0 ? "Full Length Test" : "Live Test",
                                        date: `${String(startDay).padStart(2, '0')}/02/2026 - ${String(startDay + 7).padStart(2, '0')}/02/2026`
                                    });
                                }

                                return liveTests;
                            })().map((test) => (
                                <div key={test.id} className="group bg-white rounded-xl py-2 px-4 shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-0.5 w-full flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-xl ${test.isLive ? 'bg-red-500' : 'bg-green-500'}`}></div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden ${test.isLive ? 'bg-red-50' : 'bg-green-50'}`}>
                                            <img src="/images/paper2.png" alt="Test Icon" className="w-6 h-6 object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="!text-[16px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{test.title}</h4>
                                                {test.isLive ? (
                                                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                                        LIVE
                                                    </span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                                                        UPCOMING
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                                                <span>{test.questions} Questions</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{test.marks} Marks</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{test.minutes} Mins</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-[4rem] md:pl-0">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <i className="material-symbols-outlined text-[14px]">calendar_today</i>
                                            <span>{test.date.split('(')[0]}</span>
                                        </div>
                                        <div>
                                            {(() => {
                                                const testId = `${title}-test-${test.id}`;
                                                const isCompleted = testStates[testId] || false;

                                                if (isCompleted) {
                                                    return (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleViewReport(testId, test.title)}
                                                                className="bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 uppercase tracking-wide"
                                                            >
                                                                Result
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteReport(testId)}
                                                                className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg transition-all duration-300"
                                                                title="Delete Result"
                                                            >
                                                                <i className="material-symbols-outlined text-[18px]">delete</i>
                                                            </button>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <button
                                                            onClick={() => handleStartTest(testId, test.title, test.questions, test.marks, test.minutes)}
                                                            className="bg-white border border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 shadow-sm group-hover:shadow-blue-200 hover:scale-105 active:scale-95 uppercase tracking-wider"
                                                        >
                                                            Start
                                                        </button>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </main>
        </div>
    );
};

export default TestCourseDetails;