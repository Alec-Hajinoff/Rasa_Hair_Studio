import React from "react";
import { Link, useLocation } from "react-router-dom";
import blue from "./Images/Loveday_Auto_Logo.svg";
import LogoutComponent from "./LogoutComponent";
import "./Header.css";

function Header({ isAuthenticated, isLoading, onLogoutComplete }) {
  const location = useLocation();

  return (
    <header className="header-wrapper">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-12 col-md-6 mb-3 mb-md-0">
            <Link to="/">
              <img
                id="logo"
                src={blue}
                alt="Loveday Auto Repairs Logo"
                title="Loveday Auto Repairs"
              />
            </Link>
          </div>

          <div className="col-12 col-md-6 text-end d-flex align-items-center justify-content-md-end justify-content-start gap-3">
            {!isLoading &&
              (isAuthenticated ? (
                <div className="d-flex align-items-center justify-content-end w-100">
                  <LogoutComponent onLogoutComplete={onLogoutComplete} />
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-end gap-3 w-100">
                  <Link
                    to="/UserLogin"
                    className={`header-btn-ghost ${
                      location.pathname === "/UserLogin" ? "active" : ""
                    }`}
                  >
                    Log in
                  </Link>

                  <Link
                    to="/UserRegistration"
                    className={`header-btn-signup ${
                      location.pathname === "/UserRegistration" ? "active" : ""
                    }`}
                  >
                    Sign up
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
