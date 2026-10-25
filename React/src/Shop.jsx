import React, { useEffect, useState } from "react";
import { shopGetProducts } from "./ApiService";
import "./Shop.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Shop() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
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
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const getProductImageUrl = (imagePath) => {
    if (!imagePath) return null;

    try {
      return new URL(imagePath, API_BASE_URL).toString();
    } catch {
      return imagePath;
    }
  };

  return (
    <div className="container">
      <section className="shop-page">
        <h1>Shop</h1>
        <p>Browse products from Rasa Hair Studio.</p>

        {isLoading && <p>Loading products...</p>}
        {!isLoading && errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        {!isLoading && !errorMessage && products.length === 0 && (
          <p>No products are currently available.</p>
        )}

        {!isLoading && !errorMessage && products.length > 0 && (
          <div className="row g-4">
            {products.map((product) => {
              const imageUrl = getProductImageUrl(product.image_path);

              return (
                <div className="col-12 col-sm-6 col-lg-4" key={product.id}>
                  <div className="card h-100 shop-product-card">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        className="card-img-top shop-product-image"
                        alt={product.name}
                      />
                    )}

                    <div className="card-body">
                      <h2 className="card-title h5">{product.name}</h2>

                      {product.description && (
                        <p className="card-text">{product.description}</p>
                      )}

                      <p className="card-text fw-bold">
                        £{Number(product.price_gbp).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Shop;
