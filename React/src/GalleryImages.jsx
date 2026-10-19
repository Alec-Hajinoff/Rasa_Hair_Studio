import React, { useState, useEffect } from "react";
import "./GalleryImages.css";
import { galleryImages } from "./ApiService";

function GalleryImages() {
  const [images, setImages] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await galleryImages();
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

    fetchImages();
  }, []);

  const handleOpenModal = (image) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  if (isLoading) {
    return <div className="mt-4 text-center">Loading gallery...</div>;
  }

  if (error) {
    return <div className="mt-4 alert alert-danger">{error}</div>;
  }

  return (
    <div className="gallery-images-wrapper">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h1 className="gallery-title">Gallery</h1>
          </div>
        </div>

        {images.length === 0 ? (
          <p className="gallery-empty">No images to display yet.</p>
        ) : (
          <div className="gallery-grid">
            {images.map((img) => (
              <div key={img.id} className="gallery-card">
                <img
                  src={`http://localhost:8001${img.image_path}`}
                  alt={img.title}
                  className="gallery-thumbnail"
                  onClick={() => handleOpenModal(img)}
                />
                <div className="gallery-info">
                  <p className="gallery-title-text" title={img.title}>
                    {img.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{selectedImage.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <img
                    src={`http://localhost:8001${selectedImage.image_path}`}
                    alt={selectedImage.title}
                    className="gallery-modal-img"
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Close
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

export default GalleryImages;
