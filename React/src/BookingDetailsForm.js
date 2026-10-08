import React, { useState, useEffect } from "react";
import "./BookingDetailsForm.css";
import { bookingDetailsForm } from "./ApiService";

function BookingDetailsForm({ onConfirm, submitting }) {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [notes, setNotes] = useState("");

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const clearMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await bookingDetailsForm();
        if (response.status === "success") {
          setServices(response.services);

          if (response.user) {
            setFirstName(response.user.first_name || "");
            setSurname(response.user.surname || "");
            setPhone(response.user.phone || "");
          }
        }
      } catch (err) {
        console.error("Failed to load booking form data:", err);
      }
    };
    fetchFormData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!vehicleReg.trim()) {
      setMessage(
        "Please enter a valid vehicle registration number to proceed.",
      );
      setMessageType("error");
      clearMessageAfterDelay();
      return;
    }

    if (!serviceId && !notes.trim()) {
      setMessage(
        "Please select a garage service or provide details in the notes section.",
      );
      setMessageType("error");
      clearMessageAfterDelay();
      return;
    }

    if (!firstName.trim()) {
      setMessage("Please enter your first name.");
      setMessageType("error");
      clearMessageAfterDelay();
      return;
    }

    if (!surname.trim()) {
      setMessage("Please enter your surname.");
      setMessageType("error");
      clearMessageAfterDelay();
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter a telephone number so we can reach you.");
      setMessageType("error");
      clearMessageAfterDelay();
      return;
    }

    onConfirm({
      service_id: serviceId ? parseInt(serviceId, 10) : null,
      vehicle_reg: vehicleReg.trim(),
      notes: notes.trim() || null,
      first_name: firstName.trim(),
      surname: surname.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <div>
      <h6 className="text-primary mb-2">Enter Appointment Details</h6>

      <div className="card">
        <div className="card-body">
          <form
            className="booking-details-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {message && (
              <div
                className={`mb-3 ${
                  messageType === "success"
                    ? "booking-message-success"
                    : "booking-message-error"
                }`}
              >
                {message}
              </div>
            )}

            <div className="booking-form-group">
              <label className="form-label fw-bold">
                Vehicle Registration <span className="text-danger">*</span>
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. AB12CDE"
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value)}
              />
            </div>

            <div className="booking-form-group">
              <label className="form-label fw-bold">Select Service</label>
              <select
                className="form-select"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                <option value="">
                  -- Choose a Service (Optional if notes provided) --
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="booking-form-group">
              <label className="form-label fw-bold">Notes</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Describe your requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="row">
              <div className="col-md-6 booking-form-group">
                <label className="form-label fw-bold">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="col-md-6 booking-form-group">
                <label className="form-label fw-bold">
                  Surname <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Doe"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                />
              </div>
            </div>

            <div className="booking-form-group">
              <label className="form-label fw-bold">
                Telephone Number <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. 07123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm mt-2"
              disabled={submitting}
            >
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsForm;
