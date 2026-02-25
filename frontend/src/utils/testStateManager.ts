// Test State Manager - Handles test state persistence in localStorage

export type TestStatus = 'NOT_STARTED' | 'COMPLETED';

export interface TestState {
    status: TestStatus;
    score?: number;
    total?: number;
    completedAt?: string;
}

const STORAGE_KEY = 'lms_test_states';

/**
 * Get all test states from localStorage
 */
const getAllStates = (): Record<string, TestState> => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading test states:', error);
        return {};
    }
};

/**
 * Save all test states to localStorage
 */
const saveAllStates = (states: Record<string, TestState>): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    } catch (error) {
        console.error('Error saving test states:', error);
    }
};

/**
 * Get the state of a specific test
 */
export const getTestState = (testId: string): TestState => {
    const states = getAllStates();
    return states[testId] || { status: 'NOT_STARTED' };
};

/**
 * Set the state of a specific test
 */
export const setTestState = (testId: string, state: TestState): void => {
    const states = getAllStates();
    states[testId] = state;
    saveAllStates(states);
};

/**
 * Delete the state of a specific test
 */
export const deleteTestState = (testId: string): void => {
    const states = getAllStates();
    delete states[testId];
    saveAllStates(states);
};

/**
 * Check if a test is completed
 */
export const isTestCompleted = (testId: string): boolean => {
    const state = getTestState(testId);
    return state.status === 'COMPLETED';
};

/**
 * Mark a test as completed with results
 */
export const completeTest = (
    testId: string,
    score: number,
    total: number
): void => {
    setTestState(testId, {
        status: 'COMPLETED',
        score,
        total,
        completedAt: new Date().toISOString(),
    });
};
