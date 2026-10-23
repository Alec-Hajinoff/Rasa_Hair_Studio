import React, { useState } from "react";
import { adminBlogEntry } from "./ApiService";
import "./AdminBlogEntry.css";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

function AdminBlogEntry({ onPostSaved }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setMessage("");
    setMessageType("");

    if (!selectedFile) {
      setImage(null);
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      setImage(null);
      event.target.value = "";
      setMessage("The featured image must be 2MB or smaller.");
      setMessageType("danger");
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      setImage(null);
      event.target.value = "";
      setMessage("Choose a JPG or PNG image.");
      setMessageType("danger");
      return;
    }

    setImage(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content.trim());

    if (image) {
      formData.append("image", image);
    }

    setIsSubmitting(true);

    try {
      const result = await adminBlogEntry(formData);

      if (result.status !== "success") {
        throw new Error(result.message || "The blog post could not be saved.");
      }

      setTitle("");
      setContent("");
      setImage(null);
      event.target.reset();

      onPostSaved?.();

      setMessage(result.message || "Blog post saved successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "An error occurred while saving the post.");
      setMessageType("danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-blog-entry card shadow-sm">
      <div className="card-body">
        <h4 className="card-title mb-4">Write a blog post</h4>

        {message && (
          <div className={`alert alert-${messageType}`} role="alert">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="blog-title" className="form-label">
              Blog title
            </label>
            <input
              id="blog-title"
              className="form-control"
              type="text"
              maxLength={255}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="blog-content" className="form-label">
              Blog content
            </label>
            <textarea
              id="blog-content"
              className="form-control"
              rows="10"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="blog-image" className="form-label">
              Featured image <span className="text-muted">(optional)</span>
            </label>
            <input
              id="blog-image"
              className="form-control"
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleImageChange}
            />
            <div className="form-text">
              JPG or PNG, maximum 2MB. Leave empty to save without an image.
            </div>
            {image && (
              <div className="small text-muted mt-2">
                Selected: {image.name}
              </div>
            )}
          </div>

          <button
            className="btn btn-dark"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save blog post"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminBlogEntry;
