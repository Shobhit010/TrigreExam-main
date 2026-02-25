import axios, { type AxiosInstance, type AxiosError } from 'axios';

// ---- User interface reflecting RUPPI data shape ------------------------
// AuthContext.tsx imports this type — changes here propagate automatically.
export interface User {
  id: string;
  student_id: string;
  email: string;
  firstname: string;
  lastname: string;
  name: string;         // Maps from RUPPI "firstname" + "lastname"
  mobile: string;
  profile_pic: string | null;
  class?: string;
  segment?: string;
  address?: string;
}

// ---- localStorage keys -------------------------------------------------
const TOKEN_KEY = 'trigreexam_auth_token';
const USER_KEY = 'trigreexam_auth_user';

// ---- Axios instance ----------------------------------------------------
// VITE_API_BASE_URL is defined in frontend/.env
// Vite exposes only VITE_* variables to the browser bundle.
// NOTE: Do NOT set a default Content-Type header — Axios 1.x auto-detects
// it from the request body (application/json for objects, multipart/form-data
// for FormData). A hard-coded default can override FormData auto-detection.
const apiClient: AxiosInstance = axios.create({
  baseURL: (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '',
  timeout: 15000,
});

// Attach JWT to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401: clear stale session — PrivateRoutes will redirect to sign-in
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error(`401 Unauthorized for URL: ${error.config?.url}`);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);

// ---- Backend response shapes -------------------------------------------

interface LoginApiResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

interface RegisterApiResponse {
  success: boolean;
  message: string;
  data: {
    student_id: string;
    requires_verification: boolean;
    message: string;
  };
}

interface SimpleApiResponse {
  success: boolean;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---- authService -------------------------------------------------------
// The exported shape must remain stable — AuthContext.tsx depends on it.
export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await apiClient.post<LoginApiResponse>('/api/auth/login', {
      username,  // Backend forwards this to RUPPI as the username field
      password,
    });

    const { token, user } = response.data.data;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  },

  // AUTH-002 — Register (multipart/form-data for optional profile_pic)
  register: async (formData: FormData): Promise<{ student_id: string; requires_verification: boolean }> => {
    const response = await apiClient.post<RegisterApiResponse>('/api/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // AUTH-003 — Forgot Password (send OTP to mobile)
  forgotPassword: async (mobile: string): Promise<void> => {
    await apiClient.post<SimpleApiResponse>('/api/auth/forgot-password', { mobile });
  },

  // AUTH-004 — Verify OTP
  verifyOtp: async (mobile: string, otp: string): Promise<void> => {
    await apiClient.post<SimpleApiResponse>('/api/auth/verify-otp', { mobile, otp });
  },

  // AUTH-005 — Reset Password
  resetPassword: async (mobile: string, password: string, confirmPassword: string): Promise<void> => {
    await apiClient.post<SimpleApiResponse>('/api/auth/reset-password', {
      mobile,
      password,
      confirm_password: confirmPassword,
    });
  },

  // AUTH-006 — Resend Verification Code (email)
  resendCode: async (studentId: string): Promise<void> => {
    await apiClient.post<SimpleApiResponse>('/api/auth/resend-code', { student_id: studentId });
  },

  // AUTH-007 — Verify Student OTP (signup email OTP verification)
  verifyStudentOtp: async (studentId: string, code: string): Promise<void> => {
    await apiClient.post<SimpleApiResponse>('/api/auth/verify-student', {
      student_id: studentId,
      code,
    });
  },

  // AUTH-008 — Change Password (authenticated user)
  changePassword: async (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> => {
    await apiClient.post<SimpleApiResponse>('/api/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  // Checks for the token key — both token AND user must exist for a valid session
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/api/auth/profile');
    const user = response.data.data;

    // Update localStorage with fresh data
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  },

  updateProfile: async (data: Partial<User>): Promise<void> => {
    await apiClient.post('/api/auth/update-profile', data);
    await authService.getProfile();
  },

  // Sends profile update as multipart/form-data (required when a profile_pic file is included).
  // Axios 1.x automatically detects browser FormData and sets the correct
  // 'multipart/form-data; boundary=...' Content-Type — no manual override needed.
  updateProfileFormData: async (formData: FormData): Promise<void> => {
    await apiClient.post('/api/auth/update-profile', formData);
  },

  // Exposed for other services that need authenticated API access
  getApiClient: (): AxiosInstance => apiClient,
};
