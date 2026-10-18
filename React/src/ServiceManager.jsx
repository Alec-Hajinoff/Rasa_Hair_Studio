import React, { useState } from "react";
import "./ServiceManager.css";
import { serviceManager } from "./ApiService";

function ServiceManager({ onSaved }) {
  const [services, setServices] = useState([
    { title: "", description: "", price_type: "fixed", price: "" },
  ]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const clearSuccessMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage("");
    }, 5000);
  };

  const handleAddService = () => {
    setServices((prev) => [
      ...prev,
      { title: "", description: "", price_type: "fixed", price: "" },
    ]);
  };

  const handleRemoveService = (index) => {
    if (services.length === 1) return;
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    setServices((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          if (field === "price_type" && value === "consultation") {
            return { ...item, [field]: value, price: "" };
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const isValid = services.every((s) => {
      const isTitleValid = s.title.trim() !== "";
      const isDescValid = s.description.trim() !== "";
      const isPriceTypeValid = ["fixed", "from", "consultation"].includes(
        s.price_type,
      );

      let isPriceValid = true;
      if (s.price_type === "fixed" || s.price_type === "from") {
        isPriceValid = s.price !== "" && Number(s.price) >= 0;
      }

      return isTitleValid && isDescValid && isPriceTypeValid && isPriceValid;
    });

    if (!isValid) {
      setMessage(
        "Please complete all required fields. A valid price is required for Fixed or From price types.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await serviceManager(services);
      if (response.status === "success") {
        setMessage("Services saved successfully.");

        clearSuccessMessageAfterDelay();

        setServices([
          { title: "", description: "", price_type: "fixed", price: "" },
        ]);

        onSaved?.();
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
      <h6 className="text-primary mt-4 mb-4">Add Salon Services</h6>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {services.map((service, index) => (
              <div
                key={index}
                className="row g-3 align-items-start mb-3 pb-3 border-bottom"
              >
                <div className="col-12 col-md-6">
                  <label className="form-label system-font-label">
                    Service #{index + 1} Title{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={service.title}
                    required
                    onChange={(e) =>
                      handleChange(index, "title", e.target.value)
                    }
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label system-font-label d-block">
                    Price Type <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex gap-3 mt-2">
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        id={`fixed-${index}`}
                        name={`price_type_${index}`}
                        value="fixed"
                        checked={service.price_type === "fixed"}
                        onChange={(e) =>
                          handleChange(index, "price_type", e.target.value)
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`fixed-${index}`}
                      >
                        Fixed Price
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        id={`from-${index}`}
                        name={`price_type_${index}`}
                        value="from"
                        checked={service.price_type === "from"}
                        onChange={(e) =>
                          handleChange(index, "price_type", e.target.value)
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`from-${index}`}
                      >
                        From Price
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        id={`consultation-${index}`}
                        name={`price_type_${index}`}
                        value="consultation"
                        checked={service.price_type === "consultation"}
                        onChange={(e) =>
                          handleChange(index, "price_type", e.target.value)
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`consultation-${index}`}
                      >
                        Consultation Required
                      </label>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-8">
                  <label className="form-label system-font-label">
                    Service Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={service.description}
                    required
                    onChange={(e) =>
                      handleChange(index, "description", e.target.value)
                    }
                  />
                </div>

                {service.price_type !== "consultation" && (
                  <div className="col-12 col-md-4">
                    <label className="form-label system-font-label">
                      Price (£) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      step="0.01"
                      min="0"
                      value={service.price}
                      required={service.price_type !== "consultation"}
                      onChange={(e) =>
                        handleChange(index, "price", e.target.value)
                      }
                    />
                  </div>
                )}

                {services.length > 1 && (
                  <div className="col-12 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm mt-2"
                      value={index}
                      onClick={() => handleRemoveService(index)}
                    >
                      Remove Service
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
