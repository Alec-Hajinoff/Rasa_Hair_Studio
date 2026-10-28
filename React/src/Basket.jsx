import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBasket } from "./BasketContext";
import { deliveryChargeGet, shopCreateCheckoutSession } from "./ApiService";
import "./Basket.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function poundsToPence(value) {
  const priceText = String(value ?? "0").trim();
  const match = priceText.match(/^(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    return 0;
  }

  const pounds = Number(match[1]);
  const pence = Number((match[2] || "").padEnd(2, "0"));

  return pounds * 100 + pence;
}

function formatPence(amountPence) {
  return gbpFormatter.format(amountPence / 100);
}

function Basket() {
  const { items, updateQuantity, removeItem, clearBasket } = useBasket();

  const [deliveryChargePence, setDeliveryChargePence] = useState(null);
  const [deliveryChargeError, setDeliveryChargeError] = useState("");
  const [isLoadingDeliveryCharge, setIsLoadingDeliveryCharge] = useState(true);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDeliveryCharge() {
      setIsLoadingDeliveryCharge(true);
      setDeliveryChargeError("");

      try {
        const deliveryCharge = await deliveryChargeGet();

        if (isMounted) {
          setDeliveryChargePence(deliveryCharge.delivery_charge_pence);
        }
      } catch (error) {
        if (isMounted) {
          setDeliveryChargeError(
            error.message || "The delivery charge could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingDeliveryCharge(false);
        }
      }
    }

    loadDeliveryCharge();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const productSubtotalPence = items.reduce((sum, item) => {
    const unitPricePence = poundsToPence(item.price_gbp);
    const quantity = Number(item.quantity) || 0;

    return sum + unitPricePence * quantity;
  }, 0);

  const basketTotalPence = productSubtotalPence + (deliveryChargePence ?? 0);

  async function handleCheckout() {
    if (
      items.length === 0 ||
      isCheckingOut ||
      deliveryChargePence === null ||
      deliveryChargeError
    ) {
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError("");

    try {
      const session = await shopCreateCheckoutSession(
        items,
        deliveryChargePence,
      );
      window.location.assign(session.url);
    } catch (error) {
      setCheckoutError(error.message || "Checkout could not be started.");
      setIsCheckingOut(false);
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
          {checkoutError && (
            <div className="alert alert-danger" role="alert">
              {checkoutError}
            </div>
          )}

          {deliveryChargeError && (
            <div className="alert alert-danger" role="alert">
              {deliveryChargeError} Checkout is unavailable until the fee has
              loaded.
            </div>
          )}

          <div className="list-group mb-4">
            {items.map((item) => {
              const imageUrl = getImageUrl(item.image_path);
              const lineTotalPence =
                poundsToPence(item.price_gbp) * Number(item.quantity);

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
                      {formatPence(poundsToPence(item.price_gbp))} each
                    </p>

                    <div className="basket-quantity-control">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={isCheckingOut}
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
                        disabled={isCheckingOut}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-link"
                        disabled={isCheckingOut}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong className="basket-line-total">
                    {formatPence(lineTotalPence)}
                  </strong>
                </article>
              );
            })}
          </div>

          <section className="basket-summary" aria-label="Basket totals">
            <div className="basket-summary-lines">
              <p className="basket-summary-line">
                <span>Products</span>
                <span>{formatPence(productSubtotalPence)}</span>
              </p>

              <p className="basket-summary-line">
                <span>Standard delivery</span>
                <span>
                  {isLoadingDeliveryCharge
                    ? "Loading..."
                    : deliveryChargePence === null
                      ? "Unavailable"
                      : formatPence(deliveryChargePence)}
                </span>
              </p>

              <p className="basket-summary-line basket-summary-total">
                <strong>Total</strong>
                <strong>{formatPence(basketTotalPence)}</strong>
              </p>
            </div>

            <div className="basket-summary-actions">
              <button
                type="button"
                className="btn btn-outline-danger"
                disabled={isCheckingOut}
                onClick={clearBasket}
              >
                Clear basket
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  isCheckingOut ||
                  items.length === 0 ||
                  isLoadingDeliveryCharge ||
                  deliveryChargePence === null ||
                  Boolean(deliveryChargeError)
                }
                onClick={handleCheckout}
              >
                {isCheckingOut ? "Connecting to Stripe..." : "Checkout"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Basket;
