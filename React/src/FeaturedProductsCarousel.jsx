import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { shopGetProducts } from "./ApiService";
import "./FeaturedProductsCarousel.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function FeaturedProductsCarousel() {
  const [products, setProducts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const productList = await shopGetProducts();

        if (isMounted) {
          setProducts(productList);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Products could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (products.length < 2) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % products.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [products.length]);

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

  function showProduct(index) {
    setActiveIndex((index + products.length) % products.length);
  }

  const activeProduct = products[activeIndex];

  return (
    <section
      className="featured-products"
      aria-labelledby="featured-products-title"
    >
      <h2 id="featured-products-title" className="featured-products-title">
        Featured Products
      </h2>

      {isLoading && <p className="text-center">Loading products...</p>}

      {!isLoading && errorMessage && (
        <p className="alert alert-danger" role="alert">
          {errorMessage}
        </p>
      )}

      {!isLoading && !errorMessage && products.length === 0 && (
        <p className="text-center">No products are currently available.</p>
      )}

      {!isLoading && !errorMessage && activeProduct && (
        <div className="featured-products-content">
          <div
            className="featured-product-slide"
            aria-live="polite"
            aria-atomic="true"
          >
            {getProductImageUrl(activeProduct.image_path) && (
              <img
                className="featured-product-image"
                src={getProductImageUrl(activeProduct.image_path)}
                alt={activeProduct.name}
              />
            )}

            <h3 className="featured-product-name">{activeProduct.name}</h3>
            <p className="featured-product-price">
              £{Number(activeProduct.price_gbp).toFixed(2)}
            </p>
          </div>

          {products.length > 1 && (
            <div className="featured-products-controls">
              <button
                type="button"
                className="featured-products-arrow"
                onClick={() => showProduct(activeIndex - 1)}
                aria-label="Show previous product"
              >
                ‹
              </button>

              <div
                className="featured-products-indicators"
                aria-label="Choose a product"
              >
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`featured-products-indicator ${
                      index === activeIndex ? "is-active" : ""
                    }`}
                    onClick={() => showProduct(index)}
                    aria-label={`Show product ${index + 1}: ${product.name}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                  />
                ))}
              </div>

              <button
                type="button"
                className="featured-products-arrow"
                onClick={() => showProduct(activeIndex + 1)}
                aria-label="Show next product"
              >
                ›
              </button>
            </div>
          )}

          <Link className="btn btn-primary featured-products-cta" to="/Shop">
            Shop Our Products
          </Link>
        </div>
      )}
    </section>
  );
}

export default FeaturedProductsCarousel;
