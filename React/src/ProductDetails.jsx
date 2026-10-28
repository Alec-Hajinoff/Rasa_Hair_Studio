import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { shopGetProducts } from "./ApiService";
import { useBasket } from "./BasketContext";
import "./ProductDetails.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ProductDetails() {
  const { productId } = useParams();
  const { items, addItem, updateQuantity } = useBasket();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        const products = await shopGetProducts();
        const matchingProduct = products.find(
          (item) => String(item.id) === String(productId),
        );

        if (isMounted) {
          setProduct(matchingProduct || null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Product could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  function getProductImageUrl(imagePath) {
    if (!imagePath) {
      return null;
    }

    try {
      return new URL(imagePath, API_BASE_URL).toString();
    } catch {
      return imagePath;
    }
  }

  function getBasketQuantity(targetProductId) {
    const basketItem = items.find(
      (item) => String(item.id) === String(targetProductId),
    );

    return basketItem ? basketItem.quantity : 0;
  }

  const basketQuantity = product ? getBasketQuantity(product.id) : 0;

  return (
    <main className="container product-details-page">
      <Link to="/Shop" className="product-details-back-link">
        Back to Shop
      </Link>

      {isLoading && <p>Loading product...</p>}

      {!isLoading && errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && !product && (
        <p>Product not found or no longer available.</p>
      )}

      {!isLoading && !errorMessage && product && (
        <article className="product-details">
          {getProductImageUrl(product.image_path) && (
            <img
              className="product-details-image"
              src={getProductImageUrl(product.image_path)}
              alt={product.name}
            />
          )}

          <div className="product-details-content">
            <h1>{product.name}</h1>

            <p className="product-details-price">
              £{Number(product.price_gbp).toFixed(2)}
            </p>

            <p className="product-details-description">
              {product.description || "No product description is available."}
            </p>

            {basketQuantity === 0 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => addItem(product)}
              >
                Add
              </button>
            ) : (
              <div
                className="product-details-quantity-control"
                aria-label={`${product.name} quantity in basket`}
              >
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label={`Decrease ${product.name} quantity`}
                  onClick={() => updateQuantity(product.id, basketQuantity - 1)}
                >
                  −
                </button>

                <span
                  className="product-details-quantity-value"
                  aria-live="polite"
                >
                  {basketQuantity}
                </span>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label={`Increase ${product.name} quantity`}
                  onClick={() => updateQuantity(product.id, basketQuantity + 1)}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </article>
      )}
    </main>
  );
}

export default ProductDetails;
