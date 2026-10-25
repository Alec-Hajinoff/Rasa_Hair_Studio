import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useBasket } from "./BasketContext";
import blue from "./Images/Rasa_Hair_Studio_Logo.svg";
import LogoutComponent from "./LogoutComponent";
import "./Header.css";

function Header({ isAuthenticated, isLoading, onLogoutComplete }) {
  const location = useLocation();
  const { itemCount } = useBasket();

  return (
    <header className="header-wrapper">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-12 col-md-6 mb-3 mb-md-0">
            <Link to="/">
              <img
                id="logo"
                src={blue}
                alt="Rasa Hair Studio Logo"
                title="Rasa Hair Studio"
              />
            </Link>
          </div>

          <div className="col-12 col-md-6">
            <div className="header-account-actions">
              <Link
                to="/Basket"
                className={`header-basket-link ${
                  location.pathname.toLowerCase() === "/basket" ? "active" : ""
                }`}
                aria-label={`Basket, ${itemCount} ${
                  itemCount === 1 ? "item" : "items"
                }`}
              >
                Basket <span className="badge text-bg-light">{itemCount}</span>
              </Link>

              {!isLoading &&
                (isAuthenticated ? (
                  <LogoutComponent onLogoutComplete={onLogoutComplete} />
                ) : (
                  <div className="header-auth-links">
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
                        location.pathname === "/UserRegistration"
                          ? "active"
                          : ""
                      }`}
                    >
                      Sign up
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
