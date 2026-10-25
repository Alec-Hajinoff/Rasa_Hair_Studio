import React, { useState } from "react";
import { adminCreateProduct } from "./ApiService";
import "./AdminCreateProduct.css";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const MAX_PRICE = 99999999.99;

function AdminCreateProduct({ onProductSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (event) => {
    const selectedImage = event.target.files?.[0] ?? null;
    setMessage("");
    setError("");

    if (!selectedImage) {
      setImage(null);
      return;
    }

    const extension = selectedImage.name.split(".").pop()?.toLowerCase();

    if (
      !ALLOWED_IMAGE_TYPES.includes(selectedImage.type) ||
      !ALLOWED_IMAGE_EXTENSIONS.includes(extension)
    ) {
      setImage(null);
      event.target.value = "";
      setError("Choose a JPG or PNG image.");
      return;
    }

    if (selectedImage.size <= 0 || selectedImage.size > MAX_IMAGE_SIZE) {
      setImage(null);
      event.target.value = "";
      setError("The image must be no larger than 2MB.");
      return;
    }

    setImage(selectedImage);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = event.currentTarget;
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const numericPrice = Number(price);

    if (!trimmedName) {
      setError("Enter a product name.");
      return;
    }

    if (trimmedName.length > 255) {
      setError("The product name must be 255 characters or fewer.");
      return;
    }

    if (
      price.trim() === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      numericPrice > MAX_PRICE ||
      !/^\d{1,8}(\.\d{1,2})?$/.test(price.trim())
    ) {
      setError("Enter a price with up to 8 whole digits and 2 decimal places.");
      return;
    }

    if (image) {
      const extension = image.name.split(".").pop()?.toLowerCase();

      if (
        image.size <= 0 ||
        image.size > MAX_IMAGE_SIZE ||
        !ALLOWED_IMAGE_TYPES.includes(image.type) ||
        !ALLOWED_IMAGE_EXTENSIONS.includes(extension)
      ) {
        setError("Choose a JPG or PNG image no larger than 2MB.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("name", trimmedName);
    formData.append("description", trimmedDescription);
    formData.append("price", numericPrice.toFixed(2));

    if (image) {
      formData.append("image", image);
    }

    setIsSaving(true);

    try {
      const result = await adminCreateProduct(formData);

      setName("");
      setDescription("");
      setPrice("");
      setImage(null);
      form.reset();

      setError("");
      setMessage(result.message || "Product saved successfully.");
      onProductSaved?.();
    } catch (saveError) {
      setError(saveError.message || "The product could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-create-product">
      <h4 className="admin-create-product__heading">Add a product</h4>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="admin-create-product__field">
          <label htmlFor="product-name">Product name</label>
          <input
            id="product-name"
            name="name"
            type="text"
            maxLength={255}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="admin-create-product__field">
          <label htmlFor="product-description">Description</label>
          <textarea
            id="product-description"
            name="description"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="admin-create-product__field">
          <label htmlFor="product-price">Price (£)</label>
          <input
            id="product-price"
            name="price"
            type="number"
            min="0"
            max={MAX_PRICE}
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </div>

        <div className="admin-create-product__field">
          <label htmlFor="product-image">Product image (optional)</label>
          <input
            id="product-image"
            name="image"
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleImageChange}
          />
          <small>JPG or PNG, maximum 2MB.</small>
          {image && (
            <span className="admin-create-product__selected-file">
              Selected: {image.name}
            </span>
          )}
        </div>

        {error && (
          <p
            className="admin-create-product__message admin-create-product__message--error"
            role="alert"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            className="admin-create-product__message admin-create-product__message--success"
            role="status"
          >
            {message}
          </p>
        )}

        <button className="btn btn-dark" type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save product"}
        </button>
      </form>
    </section>
  );
}

export default AdminCreateProduct;
