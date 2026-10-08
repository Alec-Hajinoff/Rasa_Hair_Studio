import { Routes, Route } from "react-router-dom";
import MainRegLog from "./MainRegLog";
import RegisteredPage from "./RegisteredPage";
import UserDashboard from "./UserDashboard";
import LogoutComponent from "./LogoutComponent";
import VerifyEmail from "./VerifyEmail";
import PasswordReset from "./PasswordReset";
import AdminDashboard from "./AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import UserLogin from "./UserLogin";
import UserRegistration from "./UserRegistration";

import Services from "./Services";

import AboutUs from "./AboutUs";

import React from "react";

export default function AppRoutes({ isAuthenticated, userRole, isLoading }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainRegLog
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            isLoading={isLoading}
          />
        }
      />

      <Route
        path="/Services"
        element={
          <Services
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            isLoading={isLoading}
          />
        }
      />

      <Route
        path="/AboutUs"
        element={
          <AboutUs
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            isLoading={isLoading}
          />
        }
      />

      <Route path="/UserLogin" element={<UserLogin />} />
      <Route path="/UserRegistration" element={<UserRegistration />} />
      <Route path="/RegisteredPage" element={<RegisteredPage />} />
      <Route path="/LogoutComponent" element={<LogoutComponent />} />
      <Route path="/VerifyEmail" element={<VerifyEmail />} />
      <Route path="/PasswordReset" element={<PasswordReset />} />

      <Route
        path="/UserDashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/AdminDashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
