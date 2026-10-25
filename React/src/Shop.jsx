import React from "react";
import "./Shop.css";

function Shop({ isAuthenticated }) {
  return (
    <section className="shop-page">
      <h1>Shop</h1>
      <p>Studio products will be displayed here.</p>

      <div className="shop-placeholder">
        <p>Products coming soon.</p>
      </div>

      <p className="shop-auth-status">
        {isAuthenticated
          ? "You are logged in."
          : "You are browsing as a guest."}
      </p>
    </section>
  );
}

export default Shop;
