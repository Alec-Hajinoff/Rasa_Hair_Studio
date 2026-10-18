import React, { useState, useRef } from "react";
import "./AdminGalleryImages.css";
import { adminGalleryImages } from "./ApiService";

function AdminGalleryImages({ onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setFeedback(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("images[]", file);
    });

    try {
      const response = await adminGalleryImages(formData);

      if (response.status === "success") {
        setFeedback({ type: "success", message: response.message });
        setSelectedFiles([]);

        if (onUploadSuccess) onUploadSuccess();
      } else if (response.status === "partial") {
        setFeedback({ type: "warning", message: response.message });
        setSelectedFiles([]);

        if (onUploadSuccess) onUploadSuccess();
      } else {
        setFeedback({ type: "danger", message: response.message });
      }
    } catch (error) {
      setFeedback({
        type: "danger",
        message: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-gallery-uploader">
      <p className="upload-instructions">
        Upload high-quality landscape photographs. Recommended size: 1200×800
        pixels. Maximum file size: 2 MB.
      </p>

      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Select Images (JPG, PNG)
        </button>

        <input
          type="file"
          multiple
          accept="image/jpeg, image/png"
          className="upload-input-hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {selectedFiles.length > 0 && (
          <button
            type="button"
            className="btn btn-success"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Uploading...
              </>
            ) : (
              `Upload ${selectedFiles.length} Image(s)`
            )}
          </button>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <ul className="selected-files-list">
          {selectedFiles.map((file, index) => (
            <li key={`${file.name}-${index}`} className="selected-file-item">
              <span>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              {!isUploading && (
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={() => handleRemoveFile(index)}
                  aria-label="Remove file"
                >
                  &times;
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {feedback && (
        <div
          className={`alert alert-${feedback.type} upload-feedback`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}

export default AdminGalleryImages;
