import React, { useCallback, useEffect, useState } from "react";
import { adminManageProductsGet, adminManageProductsPost } from "./ApiService";
import "./AdminManageProducts.css";

function AdminManageProducts({ refreshKey = 0 }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await adminManageProductsGet();
      setProducts(result.products);
    } catch (loadError) {
      setError(loadError.message || "Products could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, refreshKey]);

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This will also delete its product image.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setError("");
    setMessage("");

    try {
      const result = await adminManageProductsPost(product.id);

      setProducts((currentProducts) =>
        currentProducts.filter((item) => item.id !== product.id),
      );
      setMessage(result.message || "Product deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message || "The product could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="admin-manage-products">
      <h4 className="admin-manage-products__heading">Products</h4>

      {error && (
        <p
          className="admin-manage-products__message admin-manage-products__message--error"
          role="alert"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          className="admin-manage-products__message admin-manage-products__message--success"
          role="status"
        >
          {message}
        </p>
      )}

      {isLoading ? (
        <p>Loading products…</p>
      ) : products.length === 0 ? (
        <p>No products have been added yet.</p>
      ) : (
        <div className="admin-manage-products__list">
          {products.map((product) => (
            <article className="admin-manage-products__row" key={product.id}>
              <div className="admin-manage-products__details">
                <h5>{product.name}</h5>
                <p>{product.description || "No description provided."}</p>
              </div>

              <button
                className="btn btn-outline-danger"
                type="button"
                onClick={() => handleDelete(product)}
                disabled={deletingId === product.id}
                aria-label={`Delete ${product.name}`}
              >
                {deletingId === product.id ? "Deleting…" : "Delete"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminManageProducts;
