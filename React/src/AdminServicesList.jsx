import React, { useState, useEffect } from "react";
import "./AdminServicesList.css";
import { adminServicesListGet, adminServicesListPost } from "./ApiService";

function AdminServicesList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [submittingId, setSubmittingId] = useState(null);

  const clearMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 5000);
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await adminServicesListGet();

      if (
        response.status === "unauthorized" ||
        response.status === "forbidden"
      ) {
        setAuthError(response.message || "Access denied.");
        return;
      }

      if (response.status === "success" && Array.isArray(response.services)) {
        const sorted = [...response.services].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
        setServices(sorted);
      } else {
        setMessage({
          text: response.message || "Unable to load services.",
          type: "error",
        });
        clearMessageAfterDelay();
      }
    } catch (err) {
      setMessage({
        text: err.message || "An unexpected error occurred.",
        type: "error",
      });
      clearMessageAfterDelay();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (service) => {
    const confirmed = window.confirm(
      `Permanently delete "${service.title}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setSubmittingId(service.id);
    setMessage({ text: "", type: "" });

    try {
      const response = await adminServicesListPost({
        action: "delete",
        id: service.id,
      });

      if (response.status === "success") {
        setMessage({ text: "Service deleted successfully.", type: "success" });
        clearMessageAfterDelay();
        await fetchServices();
      } else {
        setMessage({
          text: response.message || "Failed to delete the service.",
          type: "error",
        });
        clearMessageAfterDelay();
      }
    } catch (err) {
      setMessage({
        text: err.message || "An unexpected error occurred.",
        type: "error",
      });
      clearMessageAfterDelay();
    } finally {
      setSubmittingId(null);
    }
  };

  const priceTypeLabel = (type) => {
    if (type === "fixed") return "Fixed";
    if (type === "from") return "From";
    return "Consultation";
  };

  const formatPrice = (service) => {
    if (service.price_type === "consultation") return "N/A";
    if (service.price === null || service.price === "") return "N/A";
    return `£${Number(service.price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="admin-services-container col-12 col-md-11 col-lg-10 mx-auto">
        <p className="admin-services-loading">Loading services...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="admin-services-container col-12 col-md-11 col-lg-10 mx-auto">
        <div className="alert alert-danger" role="alert">
          {authError}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-services-container col-12 col-md-11 col-lg-10 mx-auto">
      <div className="admin-services-header">
        <h6 className="admin-services-title text-primary">
          Manage Services ({services.length})
        </h6>
        {message.text && (
          <p className={`admin-services-message ${message.type}`}>
            {message.text}
          </p>
        )}
      </div>

      {services.length === 0 ? (
        <p className="admin-services-empty">
          No services have been created yet.
        </p>
      ) : (
        services.map((service) => {
          const isSubmitting = submittingId === service.id;

          return (
            <div key={service.id} className="admin-service-card">
              <div className="admin-service-card-header">
                <div>
                  <h6 className="admin-service-card-title">{service.title}</h6>
                  <div className="admin-service-card-subtitle">
                    Created: {new Date(service.created_at).toLocaleString()}
                    {service.updated_at &&
                      service.updated_at !== service.created_at &&
                      ` • Updated: ${new Date(
                        service.updated_at,
                      ).toLocaleString()}`}
                  </div>
                </div>

                <div className="admin-service-badges">
                  <span className="admin-service-badge type">
                    {priceTypeLabel(service.price_type)}
                  </span>
                </div>
              </div>

              <div className="admin-service-form-grid">
                <div className="admin-service-field-group full-width">
                  <label>Description</label>
                  <p>{service.description}</p>
                </div>

                <div className="admin-service-field-group">
                  <label>Price Type</label>
                  <p>{priceTypeLabel(service.price_type)}</p>
                </div>

                <div className="admin-service-field-group">
                  <label>Price (£)</label>
                  <p>{formatPrice(service)}</p>
                </div>
              </div>

              <div className="admin-service-actions">
                <button
                  type="button"
                  className="btn-service-delete"
                  onClick={() => handleDelete(service)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AdminServicesList;
