import React, { useState, useEffect } from "react";
import "./AdminGalleryImagesManager.css";
import {
  adminGalleryImagesManagerGet,
  adminGalleryImagesManagerPost,
} from "./ApiService";

function AdminGalleryImagesManager({ refreshKey }) {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchImages();
  }, [refreshKey]);

  const fetchImages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminGalleryImagesManagerGet();
      if (data.error) {
        setError(data.error);
      } else if (Array.isArray(data)) {
        setImages(data);
      }
    } catch (err) {
      setError(err.message || "Failed to load images.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (image) => {
    setSelectedImage(image);
    setEditTitle(image.title);
    setEditIsActive(image.is_active === 1);
    setModalFeedback(null);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setModalFeedback(null);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setModalFeedback({ type: "danger", text: "Title cannot be empty." });
      return;
    }

    setIsSaving(true);
    setModalFeedback(null);

    try {
      const response = await adminGalleryImagesManagerPost({
        id: selectedImage.id,
        title: editTitle,
        is_active: editIsActive ? 1 : 0,
      });

      if (response.status === "success") {
        setModalFeedback({ type: "success", text: response.message });

        setImages((prev) =>
          prev.map((img) =>
            img.id === selectedImage.id
              ? { ...img, title: editTitle, is_active: editIsActive ? 1 : 0 }
              : img,
          ),
        );

        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        setModalFeedback({
          type: "danger",
          text: response.message || "Failed to update.",
        });
      }
    } catch (err) {
      setModalFeedback({
        type: "danger",
        text: err.message || "An error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="mt-4 text-center">Loading gallery...</div>;
  }

  if (error) {
    return <div className="mt-4 alert alert-danger">{error}</div>;
  }

  return (
    <div className="gallery-manager">
      <h5 className="mb-3">Manage Gallery Images</h5>

      {images.length === 0 ? (
        <p className="text-muted">No images uploaded yet.</p>
      ) : (
        <div className="gallery-grid">
          {images.map((img) => (
            <div key={img.id} className="gallery-card">
              <img
                src={`${API_BASE_URL}${img.image_path}`}
                alt={img.title}
                className={`gallery-thumbnail ${!img.is_active ? "inactive" : ""}`}
                onClick={() => handleOpenModal(img)}
              />
              <div className="gallery-info">
                <p className="gallery-title" title={img.title}>
                  {img.title}
                </p>
                <div className="gallery-status">
                  {img.is_active ? (
                    <span className="text-success">● Active</span>
                  ) : (
                    <span className="text-danger">○ Inactive</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Image</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-7 mb-3 mb-md-0">
                      <img
                        src={`${API_BASE_URL}${selectedImage.image_path}`}
                        alt={selectedImage.title}
                        className="gallery-modal-img"
                      />
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="activeSwitch"
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                          disabled={isSaving}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="activeSwitch"
                        >
                          Active
                        </label>
                      </div>

                      {modalFeedback && (
                        <div
                          className={`alert alert-${modalFeedback.type} py-2`}
                        >
                          {modalFeedback.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={isSaving}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}

export default AdminGalleryImagesManager;
