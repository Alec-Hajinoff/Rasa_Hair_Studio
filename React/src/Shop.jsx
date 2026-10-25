import React, { useEffect, useState } from "react";
import { shopGetProducts } from "./ApiService";
import { useBasket } from "./BasketContext";
import "./Shop.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Shop() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { items, addItem, updateQuantity } = useBasket();

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

  function getBasketQuantity(productId) {
    const basketItem = items.find(
      (item) => String(item.id) === String(productId),
    );

    return basketItem ? basketItem.quantity : 0;
  }

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
              const quantity = getBasketQuantity(product.id);

              return (
                <div className="col-12 col-sm-6 col-lg-4" key={product.id}>
                  <article className="card h-100 shop-product-card">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        className="card-img-top shop-product-image"
                        alt={product.name}
                      />
                    )}

                    <div className="card-body">
                      <h2 className="card-title h5">{product.name}</h2>

                      <p className="card-text fw-bold">
                        £{Number(product.price_gbp).toFixed(2)}
                      </p>

                      {quantity === 0 ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => addItem(product)}
                        >
                          Add
                        </button>
                      ) : (
                        <div
                          className="shop-quantity-control"
                          aria-label={`${product.name} quantity in basket`}
                        >
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            aria-label={`Decrease ${product.name} quantity`}
                            onClick={() =>
                              updateQuantity(product.id, quantity - 1)
                            }
                          >
                            −
                          </button>

                          <span
                            className="shop-quantity-value"
                            aria-live="polite"
                          >
                            {quantity}
                          </span>

                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            aria-label={`Increase ${product.name} quantity`}
                            onClick={() =>
                              updateQuantity(product.id, quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
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
