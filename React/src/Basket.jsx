import React from "react";
import { Link } from "react-router-dom";
import { useBasket } from "./BasketContext";
import "./Basket.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Basket() {
  const { items, subtotal, updateQuantity, removeItem, clearBasket } =
    useBasket();

  function getImageUrl(imagePath) {
    if (!imagePath) {
      return null;
    }

    try {
      return new URL(imagePath, API_BASE_URL).toString();
    } catch {
      return imagePath;
    }
  }

  return (
    <div className="container basket-page">
      <h1>Your basket</h1>

      {items.length === 0 ? (
        <div>
          <p>Your basket is empty.</p>
          <Link to="/Shop" className="btn btn-primary">
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <div className="list-group mb-4">
            {items.map((item) => {
              const imageUrl = getImageUrl(item.image_path);
              const lineTotal = Number(item.price_gbp) * Number(item.quantity);

              return (
                <article className="list-group-item basket-item" key={item.id}>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="basket-item-image"
                    />
                  )}

                  <div className="basket-item-details">
                    <h2 className="h5 mb-1">{item.name}</h2>

                    <p className="mb-2">
                      £{Number(item.price_gbp).toFixed(2)} each
                    </p>

                    <div className="basket-quantity-control">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>

                      <span aria-live="polite">{item.quantity}</span>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-link"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong className="basket-line-total">
                    £{lineTotal.toFixed(2)}
                  </strong>
                </article>
              );
            })}
          </div>

          <div className="basket-summary">
            <p className="h4 mb-0">Total: £{subtotal.toFixed(2)}</p>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={clearBasket}
            >
              Clear basket
            </button>

            <button type="button" className="btn btn-primary" disabled>
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Basket;
