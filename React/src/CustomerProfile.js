import React, { useState, useEffect } from "react";
import "./CustomerProfile.css";
import { customerProfileGet, customerProfilePost } from "./ApiService";

function CustomerProfile() {
  const [profile, setProfile] = useState({
    first_name: "",
    surname: "",
    phone: "",
  });
  const [initialProfile, setInitialProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const clearMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 5000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await customerProfileGet();
        if (response.status === "success") {
          const loadedData = {
            first_name: response.user.first_name || "",
            surname: response.user.surname || "",
            phone: response.user.phone || "",
          };
          setProfile(loadedData);
          setInitialProfile(loadedData);
        } else {
          setMessage({
            text:
              response.message ||
              "We were unable to load your profile details. Please try again.",
            type: "error",
          });
          clearMessageAfterDelay();
        }
      } catch (err) {
        setMessage({
          text:
            err.message ||
            "An unexpected error occurred while loading your profile.",
          type: "error",
        });
        clearMessageAfterDelay();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage({ text: "", type: "" });
  };

  const handleCancel = () => {
    setProfile(initialProfile);
    setIsEditing(false);
    setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await customerProfilePost(profile);
      if (response.status === "success") {
        const updatedData = {
          first_name: response.user.first_name || "",
          surname: response.user.surname || "",
          phone: response.user.phone || "",
        };
        setProfile(updatedData);
        setInitialProfile(updatedData);
        setIsEditing(false);

        setMessage({
          text: "Your personal details have been successfully updated.",
          type: "success",
        });
        clearMessageAfterDelay();
      } else {
        setMessage({
          text:
            response.message ||
            "We were unable to save your updates. Please check your information and try again.",
          type: "error",
        });
        clearMessageAfterDelay();
      }
    } catch (err) {
      setMessage({
        text:
          err.message ||
          "An unexpected error occurred while saving your details.",
        type: "error",
      });
      clearMessageAfterDelay();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-muted my-3">Loading profile...</div>;
  }

  return (
    <div className="customer-profile-card">
      <div className="profile-header-flex">
        <h6 className="text-primary mb-0">Update Your Personal Details</h6>
        {!isEditing && (
          <button
            type="button"
            className="btn-profile-edit"
            onClick={handleEdit}
          >
            Edit Details
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="profile-grid">
          <div className="profile-field-group">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={profile.first_name}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder={isEditing ? "Enter first name" : "Not provided"}
            />
          </div>

          <div className="profile-field-group">
            <label htmlFor="surname">Surname</label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={profile.surname}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder={isEditing ? "Enter surname" : "Not provided"}
            />
          </div>

          <div className="profile-field-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder={isEditing ? "Enter phone number" : "Not provided"}
            />
          </div>
        </div>

        {isEditing && (
          <div className="profile-actions">
            <button
              type="submit"
              className="btn-profile-save"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="btn-profile-cancel"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {message.text && (
        <div className="mt-2">
          <p className={`profile-status-msg ${message.type}`}>{message.text}</p>
        </div>
      )}
    </div>
  );
}

export default CustomerProfile;
