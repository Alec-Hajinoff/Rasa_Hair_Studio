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
  const [isDeleting, setIsDeleting] = useState(false);
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
      } else {
        setError("The server returned an unexpected response.");
      }
    } catch (err) {
      setError(err.message || "Failed to load images.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (image) => {
    setSelectedImage(image);
    setModalFeedback(null);
  };

  const handleCloseModal = () => {
    if (isDeleting) return;
    setSelectedImage(null);
    setModalFeedback(null);
  };

  const handleDelete = async () => {
    if (!selectedImage) return;

    const confirmed = window.confirm(
      `Permanently delete "${selectedImage.title}" from the gallery? This cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setModalFeedback(null);

    try {
      const response = await adminGalleryImagesManagerPost({
        action: "delete",
        id: selectedImage.id,
      });

      if (response.status === "success") {
        setImages((previousImages) =>
          previousImages.filter((image) => image.id !== selectedImage.id),
        );
        setModalFeedback({ type: "success", text: response.message });

        setTimeout(() => {
          setSelectedImage(null);
          setModalFeedback(null);
        }, 1200);
      } else {
        setModalFeedback({
          type: "danger",
          text: response.message || "Failed to delete the image.",
        });
      }
    } catch (err) {
      setModalFeedback({
        type: "danger",
        text: err.message || "An error occurred while deleting the image.",
      });
    } finally {
      setIsDeleting(false);
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
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              className="gallery-card"
              onClick={() => handleOpenModal(image)}
              aria-label={`View delete option for ${image.title}`}
            >
              <img
                src={`${API_BASE_URL}${image.image_path}`}
                alt={image.title}
                className="gallery-thumbnail"
              />
              <div className="gallery-info">
                <p className="gallery-title" title={image.title}>
                  {image.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedImage && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-modal-title"
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="gallery-modal-title">
                    Gallery Image
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCloseModal}
                    disabled={isDeleting}
                  />
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
                      <p className="mb-3">
                        <strong>Title:</strong> {selectedImage.title}
                      </p>

                      {modalFeedback && (
                        <div
                          className={`alert alert-${modalFeedback.type} py-2`}
                          role="status"
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
                    disabled={isDeleting}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger me-auto"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Image"}
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
