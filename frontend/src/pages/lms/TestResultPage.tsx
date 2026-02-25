import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTestState } from '../../utils/testStateManager';

const TestResultPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Try to get data from navigation state first, fallback to localStorage
    const navState = location.state as { testId?: string; testTitle?: string; score?: number; total?: number } | null;

    const [testData, setTestData] = useState<{
        testId: string;
        testTitle: string;
        score: number;
        total: number;
        completedAt?: string;
    } | null>(null);

    useEffect(() => {
        if (navState?.testId) {
            // Data from navigation state
            const state = getTestState(navState.testId);
            setTestData({
                testId: navState.testId,
                testTitle: navState.testTitle || 'Live Test',
                score: navState.score ?? state.score ?? 0,
                total: navState.total ?? state.total ?? 0,
                completedAt: state.completedAt,
            });
        } else {
            // No data available, redirect back
            navigate('/lms/test-course-details', { replace: true });
        }
    }, [navState, navigate]);

    if (!testData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0c1427] flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    const percentage = Math.round((testData.score / testData.total) * 100);
    const passed = percentage >= 40; // 40% passing criteria

    const formatDate = (isoString?: string): string => {
        if (!isoString) return 'Just now';
        const date = new Date(isoString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0c1427] py-12 px-6">
            <div className="max-w-3xl mx-auto">
                {/* Result Card */}
                <div className="bg-white dark:bg-[#0f1729] border border-gray-200 dark:border-[#172036] rounded-2xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className={`p-8 text-center ${passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <div className="mb-4">
                            <i
                                className={`material-symbols-outlined text-6xl ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}
                            >
                                {passed ? 'check_circle' : 'cancel'}
                            </i>
                        </div>
                        <h1 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {passed ? 'Test Completed!' : 'Test Completed'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">{testData.testTitle}</p>
                    </div>

                    {/* Score Section */}
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="inline-block">
                                <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                                    {testData.score}/{testData.total}
                                </div>
                                <div className="text-xl text-gray-600 dark:text-gray-400">
                                    {percentage}% Score
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gray-50 dark:bg-[#0c1427] p-4 rounded-lg text-center">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Questions</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{testData.total}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#0c1427] p-4 rounded-lg text-center">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Correct Answers</div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{testData.score}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#0c1427] p-4 rounded-lg text-center">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Wrong Answers</div>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {testData.total - testData.score}
                                </div>
                            </div>
                        </div>

                        {/* Completion Time */}
                        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-8">
                            <i className="material-symbols-outlined text-[20px]">schedule</i>
                            <span>Completed on {formatDate(testData.completedAt)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/lms/test-course-details', {
                                    state: {
                                        activeTab: 'live-tests',
                                        // Pass back title if available or extract it, otherwise rely on default
                                        title: testData.testTitle.split(' - ')[0] || "Test Course"
                                    }
                                })}
                                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Back to Tests
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestResultPage;
