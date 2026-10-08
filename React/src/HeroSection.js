import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./HeroSection.css";

function HeroSection({ isAuthenticated, userRole, isLoading }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleBookingClick = (e) => {
    e.preventDefault();

    if (isLoading) return;

    if (isAuthenticated) {
      if (userRole === "customer") {
        navigate("/UserDashboard");
      } else {
        navigate("/AdminDashboard");
      }
    } else {
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <section className="hero-section-wrapper d-flex align-items-center">
      <div className="container text-center">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="hero-content mx-auto">
              <h1 className="hero-heading">
                Professional vehicle servicing and repairs from a trusted local
                garage.
              </h1>

              <button
                onClick={handleBookingClick}
                className="btn hero-cta-btn"
                disabled={isLoading}
              >
                {isLoading ? "Checking session..." : "Book an Appointment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="booking-cta-modal-backdrop" onClick={closeModal}>
          <div
            className="booking-cta-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="booking-cta-modal-header">
              <h5 className="booking-cta-modal-title">Sign In Required</h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="booking-cta-modal-body">
              <p>
                Please log in or sign up for an account to schedule your
                appointment slot.
              </p>
            </div>

            <div className="booking-cta-modal-footer flex-column flex-sm-row">
              <Link
                to="/UserLogin"
                className="btn btn-primary"
                onClick={closeModal}
              >
                Log In
              </Link>
              <Link
                to="/UserRegistration"
                className="btn btn-outline-secondary"
                onClick={closeModal}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HeroSection;
