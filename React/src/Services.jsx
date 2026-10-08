import React from "react";
import ServicesPriceList from "./ServicesPriceList";
import BookingCallToAction from "./BookingCallToAction";
import "./Services.css";

function Services({ isAuthenticated, userRole, isLoading }) {
  return (
    <div className="services-page">
      <section className="services-hero-wrapper">
        <div className="container">
          <div className="row justify-content-center">
            <div>
              <h1 className="services-hero-headline">Our Services & Pricing</h1>
              <p className="services-hero-subheadline">
                Expert repairs, routine maintenance and MOT testing to keep you
                safely on the road
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container services-container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-11 col-lg-10 mx-auto">
            <ServicesPriceList />
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

export default Services;
