import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavigationBar.css";

function NavigationBar({ isAuthenticated, userRole }) {
  const location = useLocation();

  const getDashboardPath = () => {
    if (!isAuthenticated) return "/UserLogin";
    return userRole === "customer" ? "/UserDashboard" : "/AdminDashboard";
  };

  const targetDashboardPath = getDashboardPath();

  const isDashboardActive =
    location.pathname === "/UserDashboard" ||
    location.pathname === "/AdminDashboard";

  return (
    <div className="navigation-bar-wrapper">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <nav className="navigation-bar">
              <Link
                to="/"
                className={`nav-bar-link ${
                  location.pathname === "/" ? "active" : ""
                }`}
              >
                Home
              </Link>

              <Link
                to="/Services"
                className={`nav-bar-link ${
                  location.pathname.toLowerCase() === "/services"
                    ? "active"
                    : ""
                }`}
              >
                Services
              </Link>

              <Link
                to="/AboutUs"
                className={`nav-bar-link ${
                  location.pathname.toLowerCase() === "/aboutus" ? "active" : ""
                }`}
              >
                About Us
              </Link>

              <Link
                to={targetDashboardPath}
                className={`nav-bar-link ${isDashboardActive ? "active" : ""}`}
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavigationBar;
