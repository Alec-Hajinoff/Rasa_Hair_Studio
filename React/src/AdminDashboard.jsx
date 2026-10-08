import React, { useState } from "react";
import "./AdminDashboard.css";
import BusinessHoursManager from "./BusinessHoursManager";
import ServiceManager from "./ServiceManager";

import AdminBookingsList from "./AdminBookingsList";
import AdminBookingCalendar from "./AdminBookingCalendar";
import AvailabilityHorizonExtender from "./AvailabilityHorizonExtender";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("bookings");

  return (
    <div className="admin-container container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-11 col-lg-10 mx-auto">
          <div className="admin-header">
            <p>
              Welcome to your admin dashboard. Manage your bookings, services,
              and opening hours.
            </p>
          </div>

          <ul className="nav nav-tabs mb-4 mt-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "bookings" ? "active" : ""}`}
                onClick={() => setActiveTab("bookings")}
              >
                Bookings
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                Services
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "availability" ? "active" : ""}`}
                onClick={() => setActiveTab("availability")}
              >
                Opening Hours
              </button>
            </li>
          </ul>

          {activeTab === "bookings" && (
            <div className="tab-pane-content">
              <AdminBookingsList />
              <AdminBookingCalendar />
            </div>
          )}

          {activeTab === "products" && (
            <div className="tab-pane-content">
              <ServiceManager />
            </div>
          )}

          {activeTab === "availability" && (
            <div className="tab-pane-content">
              <BusinessHoursManager />
              <div className="mt-4">
                <AvailabilityHorizonExtender />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
