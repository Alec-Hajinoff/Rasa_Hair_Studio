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
import Shop from "./Shop";
import Basket from "./Basket";
import OrderSuccess from "./OrderSuccess";
import Blog from "./Blog";
import Services from "./Services";
import GalleryImages from "./GalleryImages";
import AboutUs from "./AboutUs";

import ProductDetails from "./ProductDetails";

export default function AppRoutes({ isAuthenticated }) {
  return (
    <Routes>
      <Route path="/" element={<MainRegLog />} />
      <Route path="/Services" element={<Services />} />
      <Route path="/Gallery" element={<GalleryImages />} />
      <Route path="/AboutUs" element={<AboutUs />} />
      <Route path="/Blog" element={<Blog />} />

      <Route
        path="/Shop"
        element={<Shop isAuthenticated={isAuthenticated} />}
      />

      <Route path="/Shop/:productId" element={<ProductDetails />} />

      <Route path="/Basket" element={<Basket />} />

      <Route path="/OrderSuccess" element={<OrderSuccess />} />

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
