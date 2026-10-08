import React from "react";
import AboutUsStory from "./AboutUsStory";
import BookingCallToAction from "./BookingCallToAction";
import "./AboutUs.css";

function AboutUs({ isAuthenticated, userRole, isLoading }) {
  return (
    <div className="about-us-page">
      <section className="about-us-hero-wrapper">
        <div className="container">
          <div className="row justify-content-center">
            <div>
              <h1 className="about-us-hero-headline">Roots in the Community</h1>
              <p className="services-hero-subheadline">
                A Century of Motoring Heritage
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container about-us-container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-11 col-lg-10 mx-auto">
            <AboutUsStory />
            <BookingCallToAction
              isAuthenticated={isAuthenticated}
              userRole={userRole}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
