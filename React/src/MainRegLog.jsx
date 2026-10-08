import React, { useState, useEffect, useRef } from "react";
import "./MainRegLog.css";
import MainComponent from "./MainComponent.jsx";
import UserRegistration from "./UserRegistration.js";
import UserLogin from "./UserLogin.js";

function MainRegLog({ isAuthenticated, userRole, isLoading }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  const toggleTooltip = (e) => {
    e.stopPropagation();
    setShowTooltip((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <MainComponent
      isAuthenticated={isAuthenticated}
      userRole={userRole}
      isLoading={isLoading}
    />
  );
}

export default MainRegLog;
