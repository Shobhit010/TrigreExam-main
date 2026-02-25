import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoutes from "./components/PrivateRoutes";

// Authentication Pages
import SignIn from "./pages/authentication/SignIn";
import SignUp from "./pages/authentication/SignUp";
import ForgotPassword from "./pages/authentication/ForgotPassword";
import VerifyOtp from "./pages/authentication/VerifyOtp";
import ResetPassword from "./pages/authentication/ResetPassword";
import ConfirmEmail from "./pages/authentication/ConfirmEmail";

// Dashboard Pages
import Lms from "./pages/dashboard/Lms";
import MyCourses from "./pages/dashboard/MyCourses";
import MyResults from "./pages/dashboard/MyResults";
import MyPurchases from "./pages/dashboard/MyPurchases";
import TestReport from "./pages/dashboard/TestReport";
import Announcements from "./pages/dashboard/Announcements";
import VideoCoursePlayer from "./pages/lms/VideoCoursePlayer";
import TestCourseDetails from "./pages/lms/TestCourseDetails";
import TestResultPage from "./pages/lms/TestResultPage";

// Settings Pages
import AccountSettings from "./pages/settings/AccountSettings";
import ChangePassword from "./pages/settings/ChangePassword";

// Other Pages
import Help from "./pages/Help";
import Invoice from "./pages/Invoice";
import NotFound from "./pages/NotFound";

import Layout from "./components/Layout/Layout";

const App: React.FC = () => {
  return (
    <>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Root redirect to sign-in */}
              <Route path="/" element={<Navigate to="/authentication/sign-in" replace />} />

              {/* Authentication Pages */}
              <Route path="/authentication/sign-in" element={<SignIn />} />
              <Route path="/authentication/sign-up" element={<SignUp />} />
              <Route path="/authentication/forgot-password" element={<ForgotPassword />} />
              <Route path="/authentication/verify-otp" element={<VerifyOtp />} />
              <Route path="/authentication/reset-password" element={<ResetPassword />} />
              <Route path="/authentication/confirm-email" element={<ConfirmEmail />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoutes />}>
                {/* Dashboard */}
                <Route path="/dashboard" element={<Lms />} />
                <Route path="/lms/video-course-player" element={<VideoCoursePlayer />} />
                <Route path="/lms/test-course-details" element={<TestCourseDetails />} />
                <Route path="/dashboard/test-report" element={<TestResultPage />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/my-results" element={<MyResults />} />
                <Route path="/my-results/test-report" element={<TestReport />} />
                <Route path="/my-purchases" element={<MyPurchases />} />
                <Route path="/announcements" element={<Announcements />} />

                {/* Settings */}
                <Route path="/settings" element={<AccountSettings />} />
                <Route path="/settings/change-password" element={<ChangePassword />} />

                {/* Help */}
                <Route path="/help" element={<Help />} />

                {/* Invoice */}
                <Route path="/invoice/:orderId" element={<Invoice />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </>
  );
};

export default App;
