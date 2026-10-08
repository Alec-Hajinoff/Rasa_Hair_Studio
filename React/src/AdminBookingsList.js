import React, { useState, useEffect, useCallback } from "react";
import "./AdminBookingsList.css";
import { adminBookingsList } from "./ApiService";

import AdminCancelBooking from "./AdminCancelBooking";

const formatISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function AdminBookingsList() {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;

  const fetchBookings = useCallback(async () => {
    try {
      const response = await adminBookingsList();
      if (response.status === "success") {
        setUpcoming(response.upcoming);
      } else {
        setError(response.message || "Could not load bookings.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();

    const handleBookingUpdate = () => {
      fetchBookings();
    };

    window.addEventListener("bookingUpdated", handleBookingUpdate);
    return () => {
      window.removeEventListener("bookingUpdated", handleBookingUpdate);
    };
  }, [fetchBookings]);

  const handleBookingCancelled = () => {
    fetchBookings();
    window.dispatchEvent(new CustomEvent("bookingUpdated"));
  };

  const formatUKDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  if (loading) {
    return <div className="text-muted my-3">Loading garage bookings...</div>;
  }

  if (error) {
    return <div className="alert alert-danger my-3">{error}</div>;
  }

  const todayStr = formatISO(new Date());
  const filteredUpcoming = upcoming.filter(
    (booking) => booking.date >= todayStr,
  );

  const totalPages = Math.ceil(filteredUpcoming.length / pageSize) || 1;
  const paginatedBookings = filteredUpcoming.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1 < totalPages ? prev + 1 : prev));
  };

  const handleTodayPage = () => {
    setCurrentPage(0);
  };

  const renderBookingCard = (booking) => (
    <div key={booking.appointment_id} className="booking-card">
      <div className="booking-card-header">
        <span className="booking-date">
          {formatUKDate(booking.date)} ({booking.start_time.slice(0, 5)} -{" "}
          {booking.end_time.slice(0, 5)})
        </span>
      </div>

      <div className="booking-card-body">
        <div className="booking-detail-item">
          <strong>Customer:</strong> {booking.first_name} {booking.surname}{" "}
          {booking.customer_phone ? `(${booking.customer_phone})` : ""}{" "}
          {booking.customer_email ? `<${booking.customer_email}>` : ""}
        </div>

        {booking.service_name && (
          <div className="booking-detail-item">
            <strong>Service:</strong> {booking.service_name}
          </div>
        )}

        {booking.vehicle_reg && (
          <div className="booking-detail-item">
            <strong>Vehicle Reg:</strong> {booking.vehicle_reg}
          </div>
        )}

        {booking.notes && (
          <div className="booking-detail-item">
            <strong>Notes:</strong> {booking.notes}
          </div>
        )}

        <AdminCancelBooking
          appointment_id={booking.appointment_id}
          onBookingCancelled={handleBookingCancelled}
        />
      </div>
    </div>
  );

  return (
    <div className="admin-bookings-container">
      <div className="bookings-section mb-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="text-primary mb-0">Upcoming Appointments</h6>
          {filteredUpcoming.length > 0 && (
            <div className="d-flex align-items-center gap-3">
              <div className="admin-calendar-nav">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  &lt; Prev
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleTodayPage}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleNextPage}
                  disabled={currentPage + 1 >= totalPages}
                >
                  Next &gt;
                </button>
              </div>
            </div>
          )}
        </div>

        {filteredUpcoming.length === 0 ? (
          <p className="text-muted">
            No upcoming appointments scheduled from today onwards.
          </p>
        ) : (
          <>{paginatedBookings.map((b) => renderBookingCard(b))}</>
        )}
      </div>
    </div>
  );
}

export default AdminBookingsList;
