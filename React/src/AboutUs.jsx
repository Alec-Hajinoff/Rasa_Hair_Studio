import React from "react";
import AboutUsStory from "./AboutUsStory";

import "./AboutUs.css";

function AboutUs() {
  return (
    <div className="about-us-page">
      <section className="about-us-hero-wrapper">
        <div className="container">
          <div className="row justify-content-center">
            <div>
              <h1 className="about-us-hero-headline">Roots in the Community</h1>
              <p className="services-hero-subheadline">
                Discover our professional hair services, tailored to your style
                and designed to help you look and feel your best.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container about-us-container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-11 col-lg-10 mx-auto">
            <AboutUsStory />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
