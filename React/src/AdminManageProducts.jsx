import React, { useCallback, useEffect, useState } from "react";
import { adminManageProductsGet, adminManageProductsPost } from "./ApiService";
import "./AdminManageProducts.css";

function AdminManageProducts({ refreshKey = 0 }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [busyProductId, setBusyProductId] = useState(null);
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

  const handleStockStatusChange = async (product, nextIsActive) => {
    setBusyProductId(product.id);
    setError("");
    setMessage("");

    try {
      const result = await adminManageProductsPost({
        action: "set_status",
        id: product.id,
        is_active: nextIsActive,
      });

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id
            ? { ...item, is_active: result.is_active }
            : item,
        ),
      );
      setMessage(result.message || "Product stock status updated.");
    } catch (statusError) {
      setError(
        statusError.message || "The product stock status could not be updated.",
      );
    } finally {
      setBusyProductId(null);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This will also delete its product image.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyProductId(product.id);
    setError("");
    setMessage("");

    try {
      const result = await adminManageProductsPost({
        action: "delete",
        id: product.id,
      });

      setProducts((currentProducts) =>
        currentProducts.filter((item) => item.id !== product.id),
      );
      setMessage(result.message || "Product deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message || "The product could not be deleted.");
    } finally {
      setBusyProductId(null);
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
          {products.map((product) => {
            const isActive = Number(product.is_active) === 1;
            const isBusy = busyProductId === product.id;

            return (
              <article className="admin-manage-products__row" key={product.id}>
                <div className="admin-manage-products__details">
                  <h5>{product.name}</h5>
                  <p>{product.description || "No description provided."}</p>
                </div>

                <div className="admin-manage-products__actions">
                  {/* This visible label names the stock selector for all users. */}
                  <label
                    className="admin-manage-products__stock-label"
                    htmlFor={`product-stock-${product.id}`}
                  >
                    Stock status
                  </label>

                  <select
                    id={`product-stock-${product.id}`}
                    className="form-select"
                    value={isActive ? "1" : "0"}
                    onChange={(event) =>
                      handleStockStatusChange(
                        product,
                        Number(event.target.value),
                      )
                    }
                    disabled={isBusy}
                  >
                    <option value="1">In stock</option>
                    <option value="0">Out of stock</option>
                  </select>

                  <button
                    className="btn btn-outline-danger"
                    type="button"
                    onClick={() => handleDelete(product)}
                    disabled={isBusy}
                    aria-label={`Delete ${product.name}`}
                  >
                    {isBusy ? "Working…" : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminManageProducts;
