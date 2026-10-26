import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useBasket } from "./BasketContext";
import "./OrderSuccess.css";

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearBasket } = useBasket();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    clearBasket();
    setIsConfirmed(true);

    navigate("/OrderSuccess", { replace: true });
  }, [sessionId, clearBasket, navigate]);

  return (
    <div className="container order-success-page">
      <section className="order-success-card">
        {isConfirmed ? (
          <>
            <div className="order-success-icon" aria-hidden="true">
              ✓
            </div>

            <h1>Thank you for your order</h1>
            <p>Your payment has been confirmed. We have received your order.</p>
          </>
        ) : (
          <>
            <h1>Order confirmation</h1>
            <p>
              We could not confirm a completed payment for this visit. Your
              basket has not been cleared.
            </p>
          </>
        )}

        <Link to="/Shop" className="btn btn-primary">
          Return to the shop
        </Link>
      </section>
    </div>
  );
}

export default OrderSuccess;
