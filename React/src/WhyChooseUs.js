import React from "react";
import "./WhyChooseUs.css";

function WhyChooseUs() {
  const reasons = [
    "Family-run since 1926",
    "Transparent pricing - no hidden fees",
    "Free collection & delivery",
    "All work backed by 12-month warranty",
  ];

  return (
    <section className="why-choose-section">
      <div className="row g-4 align-items-stretch">
        <div className="col-12 col-md-6 col-lg-6 col-xl-6">
          <div className="why-choose-container">
            <div className="why-choose-card">
              <h2 className="why-choose-heading">Why Choose Us?</h2>

              <ul className="why-choose-list gap-3">
                {reasons.map((reason, index) => (
                  <li key={index} className="why-choose-item mb-2 mb-md-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      className="bi bi-check-circle-fill why-choose-check-icon"
                      viewBox="0 0 16 16"
                    >
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                    </svg>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-6 col-xl-6">
          <div className="contact-us-container">
            <div className="contact-us-card">
              <h2 className="why-choose-heading">Contact Us</h2>
              <div className="contact-us-list">
                <div className="contact-us-row">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="bi bi-geo-alt-fill contact-us-icon"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                  </svg>
                  <div className="contact-us-content">
                    <span className="contact-us-value">
                      50a Southbury Rd, Enfield, EN1 1YB
                    </span>
                  </div>
                </div>
                <br></br>
                <div className="contact-us-row">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="bi bi-telephone-fill contact-us-icon"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"
                    />
                  </svg>
                  <div className="contact-us-content">
                    <a href="tel:02083675888" className="contact-us-value">
                      020 8367 5888
                    </a>
                  </div>
                </div>
                <br></br>

                <div className="contact-us-row">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="bi bi-envelope-fill contact-us-icon"
                    viewBox="0 0 16 16"
                  >
                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.756z" />
                  </svg>
                  <div className="contact-us-content">
                    <a
                      href="mailto:info@lovedayauto.com"
                      className="contact-us-value"
                    >
                      info@lovedayauto.com
                    </a>
                  </div>
                </div>
                <br></br>

                <div className="contact-us-row">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="bi bi-clock-fill contact-us-icon"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 3.5a.75.75 0 0 0-1.5 0v4.25c0 .276.11.528.293.71l3 3a.75.75 0 0 0 1.06-1.06L8.5 7.44V3.5z" />
                  </svg>
                  <div className="contact-us-content">
                    <span className="contact-us-value">
                      Mon - Fri | 8am - 4:30pm
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
