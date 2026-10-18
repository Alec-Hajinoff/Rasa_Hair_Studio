import React, { useState, useEffect } from "react";
import "./ServicesPriceList.css";
import { servicesPriceList } from "./ApiService";

function ServicesPriceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesPriceList();
        if (response.status === "success" && Array.isArray(response.services)) {
          setServices(response.services);
        } else {
          setError(response.message || "Unable to load services.");
        }
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const formatPrice = (service) => {
    if (service.price_type === "consultation") return "Consultation Required";
    if (service.price === null || service.price === undefined) return "N/A";

    const amount = `£${Number(service.price).toFixed(2)}`;
    return service.price_type === "from" ? `From ${amount}` : amount;
  };

  return (
    <div className="services-price-card w-100 mb-4">
      {loading && <p className="service-status-msg">Loading services…</p>}

      {!loading && error && (
        <p className="service-status-msg service-status-error">{error}</p>
      )}

      {!loading && !error && services.length === 0 && (
        <p className="service-status-msg">
          No services are currently available.
        </p>
      )}

      {!loading && !error && services.length > 0 && (
        <div className="services-list">
          {services.map((service) => (
            <div
              key={service.id}
              className="row services-list-item align-items-center py-3 mx-0"
            >
              <div className="col-12 col-md-9 service-info mb-2 mb-md-0 px-0">
                <span className="service-name">{service.title}</span>

                {service.description && (
                  <span className="service-description">
                    {service.description}
                  </span>
                )}
              </div>

              <div className="col-12 col-md-3 text-end service-price-wrapper px-0">
                <span className="service-price">{formatPrice(service)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServicesPriceList;
