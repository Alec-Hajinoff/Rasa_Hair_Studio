import React from "react";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  const user = ["i", "n", "f", "o"].join("");
  const domain = ["lovedayauto", "com"].join(".");
  const email = `${user}@${domain}`;

  return (
    <footer className="footer-wrapper">
      <div className="container text-center">
        <div className="row">
          <div className="col-12">
            <p className="footer-content mb-2">
              &copy; Copyright 2025 - {currentYear}. Garage address: 50a
              Southbury Rd, Enfield, EN1 1YB. Phone: 020 8367 5888. Email:{" "}
              <a href={`mailto:${email}`}>{email}</a>
            </p>

            <div className="footer-builder-wrapper">
              <span className="footer-builder-text">
                Web application by:{" "}
                <a
                  href="https://hertfordstandard.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-builder-link"
                >
                  Hertford Standard
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
