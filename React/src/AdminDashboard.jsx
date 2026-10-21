import React, { useState } from "react";
import "./AdminDashboard.css";
import ServiceManager from "./ServiceManager";
import AdminServicesList from "./AdminServicesList";

import AdminGalleryImages from "./AdminGalleryImages";
import AdminGalleryImagesManager from "./AdminGalleryImagesManager";

import AdminStylistProfile from "./AdminStylistProfile";

const NAV_ITEMS = [
  { key: "services", label: "Services" },
  { key: "images", label: "Images" },
  { key: "profile", label: "Stylist Profile" },
  { key: "blog", label: "Blog" },
  { key: "shop", label: "Shop & Orders" },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("services");
  const [servicesRefreshKey, setServicesRefreshKey] = useState(0);

  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);
  const [stylistRefreshKey, setStylistRefreshKey] = useState(0);

  const [offcanvasOpen, setOffcanvasOpen] = useState(false);

  const activeLabel =
    NAV_ITEMS.find((item) => item.key === activeTab)?.label ?? "";

  const renderContent = () => {
    switch (activeTab) {
      case "services":
        return (
          <div className="tab-pane-content">
            <ServiceManager
              onSaved={() => setServicesRefreshKey((k) => k + 1)}
            />
            <AdminServicesList key={servicesRefreshKey} />
          </div>
        );

      case "images":
        return (
          <div className="tab-pane-content">
            <AdminGalleryImages
              onUploadSuccess={() => setGalleryRefreshKey((k) => k + 1)}
            />
            <AdminGalleryImagesManager
              key={galleryRefreshKey}
              refreshKey={galleryRefreshKey}
            />
          </div>
        );

      case "profile":
        return (
          <div className="tab-pane-content">
            <AdminStylistProfile
              onCreated={() => setStylistRefreshKey((key) => key + 1)}
            />
          </div>
        );

      case "blog":
        return <div>Blog placeholder</div>;

      case "shop":
        return <div>Shop & Orders placeholder</div>;

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        <div className="col-lg-3 d-none d-lg-block">
          <nav
            className="nav flex-column border-end pe-3"
            style={{ minHeight: "80vh" }}
          >
            <h5 className="mb-4">Admin Panel</h5>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`nav-link text-start mb-2 ${
                  activeTab === item.key
                    ? "active fw-bold bg-light"
                    : "text-dark"
                }`}
                onClick={() => setActiveTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="col-12 col-lg-9">
          <div className="d-lg-none d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <h5 className="m-0">{activeLabel}</h5>
            <button
              className="btn btn-outline-dark"
              onClick={() => setOffcanvasOpen(true)}
            >
              ☰ Menu
            </button>
          </div>

          <div className="d-none d-lg-block mb-4">
            <h3>{activeLabel}</h3>
          </div>

          <main>{renderContent()}</main>
        </div>
      </div>

      <div
        className={`offcanvas offcanvas-start ${offcanvasOpen ? "show" : ""}`}
        tabIndex="-1"
        style={{
          visibility: offcanvasOpen ? "visible" : "hidden",
          display: "block",
          transform: offcanvasOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
          width: "250px",
        }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">Admin Panel</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setOffcanvasOpen(false)}
          ></button>
        </div>

        <div className="offcanvas-body p-0 pt-3">
          <nav className="nav flex-column px-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`nav-link text-start mb-2 ${
                  activeTab === item.key
                    ? "active fw-bold bg-light"
                    : "text-dark"
                }`}
                onClick={() => {
                  setActiveTab(item.key);
                  setOffcanvasOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {offcanvasOpen && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => setOffcanvasOpen(false)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
