import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TestInstructionsPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { testId, testTitle, questions = 10, marks = 20, minutes = 10 } = location.state || {};

    const [agreed, setAgreed] = useState(false);
    const [language, setLanguage] = useState("English");

    // Redirect if no test data
    if (!testId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">No Test Selected</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-blue-600 hover:underline"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const handleStart = () => {
        if (agreed) {
            navigate('/lms/live-test', {
                state: { testId, testTitle, questions, marks, minutes }
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="w-full px-6 flex items-center gap-3">
                    <div className="bg-cyan-500 text-white p-1 rounded">
                        {/* Logo placeholder if needed, otherwise just icon */}
                        <i className="material-symbols-outlined text-[20px]">school</i>
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 truncate" title={testTitle}>
                        {testTitle}
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full p-6">

                {/* Instructions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 w-full h-full">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                        {testTitle}
                    </h2>

                    <div className="flex flex-wrap justify-between items-center text-sm font-semibold text-gray-700 mb-6 border-b border-gray-100 pb-4">
                        <span>Duration: {minutes} Mins</span>
                        <span>Maximum Marks: {marks}</span>
                    </div>

                    <div className="prose max-w-none text-gray-600 text-sm">
                        <p className="font-bold text-gray-800 mb-2">Read the following Instructions carefully.</p>
                        <ol className="list-decimal pl-5 space-y-3">
                            <li>The test contains a total of <span className="font-bold">{questions} questions</span>.</li>
                            <li>Each question has 4 options out of which only one is correct.</li>
                            <li>You have to finish the test in <span className="font-bold">{minutes} minutes</span>.</li>
                            <li>You will be awarded <span className="font-bold">{(marks / questions).toFixed(1)} marks</span> for each correct answer and there is no negative marking.</li>
                            <li>There is no negative marking for the questions that you have not attempted.</li>
                            <li>You can write this test only once. Make sure you have a stable internet connection.</li>
                        </ol>
                    </div>
                </div>

            </main>

            {/* Footer: Declaration & Actions */}
            <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
                <div className="w-full px-6">

                    {/* Language Selector */}
                    <div className="mb-4 flex items-center gap-2 text-sm">
                        <label className="font-bold text-gray-700">Choose your default language:</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-500"
                        >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                        </select>
                        <span className="text-red-500 text-xs ml-2">
                            Please note all questions will appear in your default language. This language can be changed for a particular question later on.
                        </span>
                    </div>

                    {/* Declaration */}
                    <div className="mb-6 flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                        <input
                            type="checkbox"
                            id="declaration"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 cursor-pointer"
                        />
                        <label htmlFor="declaration" className="text-sm text-gray-600 cursor-pointer select-none leading-relaxed">
                            <span className="font-bold text-gray-800">Declaration:</span> <br />
                            I have read all the instructions carefully and have understood them. I agree not to cheat or use unfair means in this examination. I understand that using unfair means of any sort for my own or someone else's advantage will lead to my immediate disqualification. The decision of the platform will be final in these matters and cannot be appealed.
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded transition-colors"
                        >
                            Previous
                        </button>

                        <button
                            onClick={handleStart}
                            disabled={!agreed}
                            className={`font-semibold py-2 px-8 rounded transition-all shadow-sm ${agreed
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white transform hover:-translate-y-0.5'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            I am ready to begin
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TestInstructionsPage;
