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
      title: "MOT & Servicing",
      description:
        "Comprehensive statutory MOT testing and routine multi-point vehicle servicing designed to keep your car running safely and efficiently.",
      icon: motIcon,
    },
    {
      id: 2,
      title: "Brakes & Tyres",
      description:
        "Expert brake inspections, pad and disc replacements, alongside professional tyre fitting, balancing, and puncture repairs.",
      icon: wheelIcon,
    },
    {
      id: 3,
      title: "Diagnostics & Repairs",
      description:
        "Advanced computerised engine diagnostics to pinpoint fault codes quickly, backed by high-quality mechanical repairs.",
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
