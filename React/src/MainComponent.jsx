import React from "react";
import HeroSection from "./HeroSection";
import ServicesSection from "./ServicesSection";
import BookingCallToAction from "./BookingCallToAction";
import WhyChooseUs from "./WhyChooseUs";
import TestimonialCarousel from "./TestimonialCarousel";

import "./Main.css";

function Main({ isAuthenticated, userRole, isLoading }) {
  return (
    <div className="overflow-hidden">
      <div>
        <HeroSection
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          isLoading={isLoading}
        />
      </div>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-11 col-lg-10 mx-auto">
            <div className="main-container">
              <ServicesSection />

              <div>
                <BookingCallToAction
                  isAuthenticated={isAuthenticated}
                  userRole={userRole}
                  isLoading={isLoading}
                />
              </div>

              <div>
                <WhyChooseUs />
              </div>

              <div>
                <TestimonialCarousel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
