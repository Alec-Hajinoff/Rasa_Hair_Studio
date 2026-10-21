import React, { useState } from "react";
import "./UserDashboard.css";

import CustomerProfile from "./CustomerProfile";
import CustomerDeleteAccount from "./CustomerDeleteAccount";

function UserDashboard() {
  const [activeTab, setActiveTab] = useState("shop-orders");

  return (
    <div className="user-dashboard-container container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-11 col-lg-10 mx-auto">
          <div className="admin-header">
            <p>
              Welcome to your dashboard. Here you can view your shop order
              history and manage your account.
            </p>
          </div>

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "shop-orders" ? "active" : ""
                }`}
                onClick={() => setActiveTab("shop-orders")}
              >
                Shop Orders
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "account" ? "active" : ""
                }`}
                onClick={() => setActiveTab("account")}
              >
                Account
              </button>
            </li>
          </ul>

          {activeTab === "shop-orders" && (
            <div className="tab-pane-content">
              <p>Your shop order history will appear here.</p>
            </div>
          )}

          {activeTab === "account" && (
            <div className="tab-pane-content">
              <CustomerProfile />
              <div className="mt-4">
                <CustomerDeleteAccount />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
