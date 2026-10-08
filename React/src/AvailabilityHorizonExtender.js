import React, { useState } from "react";
import "./AvailabilityHorizonExtender.css";
import { availabilityHorizonExtender } from "./ApiService";

function AvailabilityHorizonExtender() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statusType, setStatusType] = useState("info");

  const clearMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage("");
      setStatusType("");
    }, 5000);
  };

  const handleExtendHorizon = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await availabilityHorizonExtender();
      if (response.status === "success") {
        setStatusType("success");
        setMessage(
          response.message ||
            "Extended availability slots by 3 additional months.",
        );
        clearMessageAfterDelay();

        window.dispatchEvent(new CustomEvent("bookingUpdated"));
      } else {
        setStatusType("danger");
        setMessage(response.message || "Failed to extend availability slots.");
        clearMessageAfterDelay();
      }
    } catch (err) {
      setStatusType("danger");
      setMessage(err.message);
      clearMessageAfterDelay();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 mb-4">
      <h6 className="text-primary mb-3">Generate appointment slots</h6>

      <div className="card availability-horizon-card">
        <div className="card-body">
          <p className="availability-horizon-text mb-3">
            Generate 3 additional months of appointment slots starting from the
            end of the existing schedule horizon.
          </p>

          {message && (
            <div className={`availability-message ${statusType}`}>
              {message}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExtendHorizon}
            disabled={loading}
          >
            {loading ? "Generating Slots..." : "Generate Additional Slots"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvailabilityHorizonExtender;
