import React, { useState } from "react";
import "./ServiceManager.css";
import { serviceManager } from "./ApiService";

function ServiceManager() {
  const [services, setServices] = useState([
    { name: "", duration_minutes: "" },
  ]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const clearSuccessMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage("");
    }, 5000);
  };

  const handleAddService = () => {
    setServices((prev) => [...prev, { name: "", duration_minutes: "" }]);
  };

  const handleRemoveService = (index) => {
    if (services.length === 1) return;
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const isValid = services.every(
      (s) =>
        s.name.trim() !== "" &&
        s.duration_minutes !== "" &&
        Number(s.duration_minutes) > 0,
    );

    if (!isValid) {
      setMessage(
        "Please complete all required fields (Name and Duration in minutes).",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await serviceManager(services);
      if (response.status === "success") {
        setMessage("Services saved successfully.");

        clearSuccessMessageAfterDelay();

        setServices([{ name: "", duration_minutes: "" }]);
      } else {
        setMessage(response.message || "Failed to save services.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-manager-container col-12 col-md-11 col-lg-10 mx-auto">
      <h6 className="text-primary mt-4 mb-4">Add Garage Services</h6>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {services.map((service, index) => (
              <div
                key={index}
                className="row g-3 align-items-center mb-3 pb-3 border-bottom"
              >
                <div className="col-12 col-md-6">
                  <label className="form-label system-font-label">
                    Service #{index + 1} Name{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={service.name}
                    required
                    onChange={(e) =>
                      handleChange(index, "name", e.target.value)
                    }
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label system-font-label">
                    Duration (Minutes) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={service.duration_minutes}
                    required
                    onChange={(e) =>
                      handleChange(index, "duration_minutes", e.target.value)
                    }
                  />
                </div>

                {services.length > 1 && (
                  <div className="col-12 col-md-2 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger w-100 mt-2 mt-md-0"
                      onClick={() => handleRemoveService(index)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="d-flex gap-2 align-items-center mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleAddService}
              >
                + Add Another Service
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Services"}
              </button>
            </div>

            {message && (
              <div className="mt-3 success-message-system">{message}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ServiceManager;
