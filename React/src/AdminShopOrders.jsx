import React, { useEffect, useState } from "react";
import { adminShopOrders } from "./ApiService";
import "./AdminShopOrders.css";

const formatMoney = (amount, currency) => {
  const currencyCode = (currency || "GBP").toUpperCase();

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode,
    }).format((Number(amount) || 0) / 100);
  } catch {
    return `${((Number(amount) || 0) / 100).toFixed(2)} ${currencyCode}`;
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

function AdminShopOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await adminShopOrders();
        if (isCurrent) setOrders(data.orders || []);
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message || "Shop orders could not be loaded.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      isCurrent = false;
    };
  }, []);

  if (loading) {
    return <p className="admin-shop-orders__message">Loading shop orders…</p>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="admin-shop-orders__message">
        No shop orders have been placed yet.
      </p>
    );
  }

  return (
    <section className="admin-shop-orders" aria-label="Shop orders">
      {orders.map((order) => (
        <article className="admin-shop-orders__card" key={order.id}>
          <header className="admin-shop-orders__header">
            <div>
              <h4 className="admin-shop-orders__title">Order #{order.id}</h4>
              <p className="admin-shop-orders__subtext">
                {formatDate(order.created_at)}
              </p>
            </div>
            <span
              className={`admin-shop-orders__status admin-shop-orders__status--${order.payment_status}`}
            >
              {order.payment_status}
            </span>
          </header>

          <div className="admin-shop-orders__details">
            <div>
              <strong>Recipient</strong>
              <span>{order.recipient_name || "—"}</span>
            </div>
            <div>
              <strong>Email</strong>
              <span>{order.recipient_email || "—"}</span>
            </div>
            <div>
              <strong>Delivery address</strong>
              <span>
                {[
                  order.address_line1,
                  order.address_line2,
                  order.city,
                  order.region,
                  order.postcode,
                  order.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </div>
            <div>
              <strong>Shipping</strong>
              <span>{formatMoney(order.shipping_amount, order.currency)}</span>
            </div>
            <div>
              <strong>Order total</strong>
              <span>{formatMoney(order.amount_total, order.currency)}</span>
            </div>
          </div>

          <div className="admin-shop-orders__items-wrap">
            <table className="admin-shop-orders__items">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Unit price</th>
                  <th scope="col">Item total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length > 0 ? (
                  order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.unit_amount, order.currency)}</td>
                      <td>{formatMoney(item.total_amount, order.currency)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      No item details recorded for this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </section>
  );
}

export default AdminShopOrders;
