import React, { useState, useEffect, useCallback } from "react";
import "./CustomerBookingsList.css";
import { customerBookingsList } from "./ApiService";
import CustomerCancelBooking from "./CustomerCancelBooking";

function CustomerBookingsList() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPastPage, setCurrentPastPage] = useState(0);
  const pageSize = 5;

  const fetchBookings = useCallback(async () => {
    try {
      const response = await customerBookingsList();
      if (response.status === "success") {
        setUpcoming(response.upcoming);
        setPast(response.past);
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
    return <div className="text-muted my-3">Loading your bookings...</div>;
  }

  if (error) {
    return <div className="alert alert-danger my-3">{error}</div>;
  }

  const totalPastPages = Math.ceil(past.length / pageSize) || 1;
  const paginatedPast = past.slice(
    currentPastPage * pageSize,
    (currentPastPage + 1) * pageSize,
  );

  const handlePrevPastPage = () => {
    setCurrentPastPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPastPage = () => {
    setCurrentPastPage((prev) => (prev + 1 < totalPastPages ? prev + 1 : prev));
  };

  const handleTodayPastPage = () => {
    setCurrentPastPage(0);
  };

  const renderBookingCard = (booking, isUpcoming) => (
    <div key={booking.appointment_id} className="booking-card">
      <div className="booking-card-header">
        <span className="booking-date">
          {formatUKDate(booking.date)} ({booking.start_time.slice(0, 5)} -{" "}
          {booking.end_time.slice(0, 5)})
        </span>
        <span className={isUpcoming ? "badge-upcoming" : "badge-past"}>
          {isUpcoming ? "Upcoming" : "Previous"}
        </span>
      </div>

      <div className="booking-card-body">
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

        {isUpcoming && (
          <CustomerCancelBooking
            appointmentId={booking.appointment_id}
            onBookingCancelled={handleBookingCancelled}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="customer-bookings-container">
      <div className="bookings-section mb-5">
        <h6 className="text-primary mb-3">Your Upcoming Appointments</h6>
        {upcoming.length === 0 ? (
          <p className="text-muted">No upcoming appointments scheduled.</p>
        ) : (
          upcoming.map((b) => renderBookingCard(b, true))
        )}
      </div>

      <div className="bookings-section">
        <h6 className="text-secondary mb-3">Your Previous Appointments</h6>
        {past.length === 0 ? (
          <p className="text-muted">No previous appointments found.</p>
        ) : (
          <>
            {paginatedPast.map((b) => renderBookingCard(b, false))}

            {past.length > 0 && (
              <div className="d-flex justify-content-end align-items-center mt-3">
                <div className="admin-calendar-nav">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm me-2"
                    onClick={handlePrevPastPage}
                    disabled={currentPastPage === 0}
                  >
                    &lt; Prev
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm me-2"
                    onClick={handleTodayPastPage}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleNextPastPage}
                    disabled={currentPastPage + 1 >= totalPastPages}
                  >
                    Next &gt;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerBookingsList;
