import React from "react";
import { Link } from "react-router-dom";
import motIcon from "./Images/mot_icon.svg";
import wheelIcon from "./Images/wheel_icon.svg";
import diagnosticsIcon from "./Images/diagnostics_icon.svg";
import "./ServicesSection.css";

function ServicesSection() {
  const servicesData = [
    {
      id: 1,
      title: "Haircuts & Styling",
      description:
        "Professional haircuts and styling tailored to your individual preferences, hair type, and desired look.",
      icon: motIcon,
    },
    {
      id: 2,
      title: "Colouring & Highlights",
      description:
        "Beautiful, personalised hair colour services, from natural-looking tones and highlights to a fresh, vibrant new look.",
      icon: wheelIcon,
    },
    {
      id: 3,
      title: "Hair Treatments",
      description:
        "Nourishing hair treatments designed to improve manageability, enhance shine, and leave your hair looking and feeling its best.",
      icon: diagnosticsIcon,
    },
  ];

  return (
    <section className="services-section">
      <h2 className="services-section-heading">Our Services</h2>
      <div className="services-grid">
        {servicesData.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-icon-wrapper">
              {service.icon ? (
                <img
                  src={service.icon}
                  alt={service.title}
                  className="service-icon"
                />
              ) : (
                <svg
                  className="service-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  />
                </svg>
              )}
            </div>
            <h3 className="service-title">{service.title}</h3>
            <p className="service-description">{service.description}</p>
            <Link to="/services" className="service-link">
              Learn more →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ServicesSection;
