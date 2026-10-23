import React from "react";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  const user = ["s", "t", "y", "l", "e"].join("");
  const domain = ["rasalstudio", "com"].join(".");
  const email = `${user}@${domain}`;

  return (
    <footer className="footer-wrapper">
      <div className="container text-center">
        <div className="row">
          <div className="col-12">
            <p className="footer-content mb-2">
              &copy; Copyright 2025 - {currentYear}. Studio address: 2
              Chaseville Parade, Chaseville Park Rd, London N21 1PG. Phone: 020
              8374 4310. Email: <a href={`mailto:${email}`}>{email}</a>
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
