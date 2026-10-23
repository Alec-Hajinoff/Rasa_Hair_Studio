import React from "react";
import ServicesPriceList from "./ServicesPriceList";

import "./Services.css";

function Services() {
  return (
    <div className="services-page">
      <section className="services-hero-wrapper">
        <div className="container">
          <div className="row justify-content-center">
            <div>
              <h1 className="services-hero-headline">Our Services & Pricing</h1>
              <p className="services-hero-subheadline">
                Discover our professional hair services, tailored to your style
                and designed to help you look and feel your best.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container services-container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-11 col-lg-10 mx-auto">
            <ServicesPriceList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Services;
