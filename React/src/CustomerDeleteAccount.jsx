import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerDeleteAccount.css";
import { customerDeleteAccount } from "./ApiService";

function CustomerDeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const clearMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 5000);
  };

  const handleInitialClick = () => {
    setConfirming(true);
    setMessage({ text: "", type: "" });
  };

  const handleAbort = () => {
    setConfirming(false);
    setMessage({ text: "", type: "" });
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const response = await customerDeleteAccount();
      if (response.status === "success") {
        navigate("/");
      } else {
        setMessage({
          text:
            response.message ||
            "We were unable to delete your account at this time. Please try again.",
          type: "error",
        });
        clearMessageAfterDelay();
      }
    } catch (err) {
      setMessage({
        text:
          err.message ||
          "An unexpected error occurred while attempting to delete your account.",
        type: "error",
      });
      clearMessageAfterDelay();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-account-card">
      <div className="delete-account-header">
        <h6 className="text-primary mb-3">Delete Your Account</h6>
        <p>
          Deleting your account will remove your personal information. This
          action cannot be undone.
        </p>
      </div>

      <div className="delete-action-container">
        {!confirming ? (
          <button
            type="button"
            className="btn-delete-initial"
            onClick={handleInitialClick}
          >
            Delete My Account
          </button>
        ) : (
          <div className="delete-confirm-box">
            <p className="cancel-confirm-text">Are you sure?</p>
            <button
              type="button"
              className="btn-confirm-delete"
              onClick={handleConfirmDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Yes, Delete Account"}
            </button>
            <button
              type="button"
              className="btn-abort-delete"
              onClick={handleAbort}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {message.text && (
        <p className={`delete-status-msg ${message.type}`}>{message.text}</p>
      )}
    </div>
  );
}

export default CustomerDeleteAccount;
