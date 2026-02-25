import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { completeTest } from '../../utils/testStateManager';

interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
}

const DUMMY_QUESTIONS: Question[] = [
    {
        id: 1,
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
    },
    {
        id: 2,
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 1,
    },
    {
        id: 3,
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
    },
    {
        id: 4,
        question: 'Who wrote "Romeo and Juliet"?',
        options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
        correctAnswer: 1,
    },
    {
        id: 5,
        question: 'What is the largest ocean on Earth?',
        options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correctAnswer: 3,
    },
];

const LiveTestPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { testId, testTitle } = location.state || { testId: 'unknown', testTitle: 'Live Test' };

    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Handle answer selection
    const handleAnswerChange = (questionId: number, optionIndex: number) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex,
        }));
    };

    // Calculate score
    const calculateScore = (): number => {
        let score = 0;
        DUMMY_QUESTIONS.forEach((q) => {
            if (answers[q.id] === q.correctAnswer) {
                score++;
            }
        });
        return score;
    };

    // Handle test submission
    const handleSubmit = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const score = calculateScore();
        const total = DUMMY_QUESTIONS.length;

        // Save result to localStorage
        completeTest(testId, score, total);

        // Navigate to result page
        navigate('/lms/test-result', {
            state: { testId, testTitle, score, total },
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0c1427]">
            {/* Header */}
            <div className="bg-white dark:bg-[#0f1729] border-b border-gray-200 dark:border-[#172036] sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{testTitle}</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {DUMMY_QUESTIONS.length} Questions
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${timeLeft <= 60
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                }`}
                        >
                            <i className="material-symbols-outlined text-[20px]">schedule</i>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    {DUMMY_QUESTIONS.map((question, index) => (
                        <div
                            key={question.id}
                            className="bg-white dark:bg-[#0f1729] border border-gray-200 dark:border-[#172036] rounded-xl p-6"
                        >
                            {/* Question */}
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {index + 1}. {question.question}
                                </h3>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {question.options.map((option, optionIndex) => (
                                    <label
                                        key={optionIndex}
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[question.id] === optionIndex
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-[#172036] hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            checked={answers[question.id] === optionIndex}
                                            onChange={() => handleAnswerChange(question.id, optionIndex)}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors uppercase tracking-wide shadow-lg"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveTestPage;
