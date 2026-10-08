import React from "react";
import "./RegisteredPage.css";
import UserLogin from "./UserLogin.js";

function RegisteredPage() {
  return (
    <div className="registered-page-wrapper">
      <div className="container text-center">
        <div className="row">
          <div className="col-12 col-md-11 col-lg-10 mx-auto text-center">
            <p className="w-100 whitespace-nowrap">
              Thank you for verifying your email address!
            </p>
          </div>
        </div>

        <div>
          <UserLogin />
        </div>
      </div>
    </div>
  );
}

export default RegisteredPage;
