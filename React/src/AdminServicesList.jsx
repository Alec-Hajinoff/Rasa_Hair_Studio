import React, { useState, useEffect } from "react";
import "./AdminServicesList.css";
import { adminServicesListGet, adminServicesListPost } from "./ApiService";

function AdminServicesList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
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

  const handleEdit = (service) => {
    setEditingId(service.id);
    setDraft({
      title: service.title || "",
      description: service.description || "",
      price_type: service.price_type || "fixed",
      price: service.price !== null ? String(service.price) : "",
    });
    setMessage({ text: "", type: "" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setDraft({});
    setMessage({ text: "", type: "" });
  };

  const handleDraftChange = (field, value) => {
    setDraft((prev) => {
      if (field === "price_type" && value === "consultation") {
        return { ...prev, price_type: value, price: "" };
      }
      return { ...prev, [field]: value };
    });
  };

  const validateDraft = (data) => {
    const titleOk = (data.title || "").trim() !== "";
    const descOk = (data.description || "").trim() !== "";
    const typeOk = ["fixed", "from", "consultation"].includes(data.price_type);
    let priceOk = true;
    if (data.price_type === "fixed" || data.price_type === "from") {
      priceOk =
        data.price !== "" &&
        data.price !== null &&
        !Number.isNaN(Number(data.price)) &&
        Number(data.price) >= 0;
    }
    return titleOk && descOk && typeOk && priceOk;
  };

  const handleSave = async (id) => {
    if (!validateDraft(draft)) {
      setMessage({
        text: "Please complete all required fields. A valid price is required for Fixed or From price types.",
        type: "error",
      });
      return;
    }

    setSubmittingId(id);
    setMessage({ text: "", type: "" });

    try {
      const response = await adminServicesListPost({
        id,
        title: draft.title.trim(),
        description: draft.description.trim(),
        price_type: draft.price_type,
        price: draft.price_type === "consultation" ? null : Number(draft.price),
      });

      if (response.status === "success") {
        setMessage({ text: "Service updated successfully.", type: "success" });
        clearMessageAfterDelay();
        setEditingId(null);
        setDraft({});
        fetchServices();
      } else {
        setMessage({
          text: response.message || "Failed to update the service.",
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

  const handleToggleActive = async (service) => {
    setSubmittingId(service.id);
    setMessage({ text: "", type: "" });

    try {
      const response = await adminServicesListPost({
        id: service.id,
        title: service.title,
        description: service.description,
        price_type: service.price_type,
        price: service.price !== null ? Number(service.price) : null,
        is_active: service.is_active ? 0 : 1,
      });

      if (response.status === "success") {
        setMessage({
          text: service.is_active
            ? "Service has been deactivated."
            : "Service has been reactivated.",
          type: "success",
        });
        clearMessageAfterDelay();
        fetchServices();
      } else {
        setMessage({
          text: response.message || "Failed to update the service status.",
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
          const isEditing = editingId === service.id;
          const data = isEditing ? draft : service;
          const isSubmitting = submittingId === service.id;

          return (
            <div
              key={service.id}
              className={`admin-service-card ${
                service.is_active ? "" : "inactive"
              }`}
            >
              <div className="admin-service-card-header">
                <div>
                  <h6 className="admin-service-card-title">
                    {isEditing ? "Editing Service" : service.title}
                  </h6>
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
                  <span
                    className={`admin-service-badge ${
                      service.is_active ? "active" : "inactive"
                    }`}
                  >
                    {service.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="admin-service-form-grid">
                <div className="admin-service-field-group full-width">
                  <label>Title</label>
                  <input
                    type="text"
                    value={data.title || ""}
                    onChange={(e) => handleDraftChange("title", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="admin-service-field-group full-width">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={data.description || ""}
                    onChange={(e) =>
                      handleDraftChange("description", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="admin-service-field-group">
                  <label>Price Type</label>
                  <select
                    value={data.price_type || "fixed"}
                    onChange={(e) =>
                      handleDraftChange("price_type", e.target.value)
                    }
                    disabled={!isEditing}
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="from">From Price</option>
                    <option value="consultation">Consultation Required</option>
                  </select>
                </div>

                <div className="admin-service-field-group">
                  <label>Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      data.price_type === "consultation" ? "" : data.price || ""
                    }
                    onChange={(e) => handleDraftChange("price", e.target.value)}
                    disabled={!isEditing || data.price_type === "consultation"}
                  />
                </div>
              </div>

              <div className="admin-service-actions">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="btn-service-save"
                      onClick={() => handleSave(service.id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn-service-cancel"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-service-edit"
                      onClick={() => handleEdit(service)}
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn-service-toggle ${
                        service.is_active ? "" : "reactivate"
                      }`}
                      onClick={() => handleToggleActive(service)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Updating..."
                        : service.is_active
                          ? "Deactivate"
                          : "Reactivate"}
                    </button>
                    <span className="admin-service-card-subtitle ms-auto">
                      Current price: {formatPrice(service)}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AdminServicesList;
