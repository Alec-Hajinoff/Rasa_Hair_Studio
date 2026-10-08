import React, { useState } from "react";
import "./BusinessHoursManager.css";
import { businessHoursManager } from "./ApiService";

const DAYS = [
  { day_of_week: 1, label: "Monday" },
  { day_of_week: 2, label: "Tuesday" },
  { day_of_week: 3, label: "Wednesday" },
  { day_of_week: 4, label: "Thursday" },
  { day_of_week: 5, label: "Friday" },
  { day_of_week: 6, label: "Saturday" },
  { day_of_week: 7, label: "Sunday" },
];

function BusinessHoursManager() {
  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      day_of_week: day.day_of_week,
      open_time: "",
      close_time: "",
      selected: false,
    })),
  );

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleToggleDay = (dayOfWeek) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek
          ? { ...item, selected: !item.selected }
          : item,
      ),
    );
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    const selectedDays = schedule
      .filter((item) => item.selected)
      .map(({ day_of_week, open_time, close_time }) => ({
        day_of_week,
        open_time,
        close_time,
      }));

    if (selectedDays.length === 0) {
      setMessage("Please select at least one day.");
      setMessageType("error");
      clearMessageAfterDelay();
      return;
    }

    const missingTimes = selectedDays.some(
      (item) => !item.open_time || !item.close_time,
    );

    if (missingTimes) {
      setMessage(
        "Please enter both opening and closing times for all selected days.",
      );
      setMessageType("error");
      clearMessageAfterDelay();
      return;
    }

    setLoading(true);

    try {
      const response = await businessHoursManager(selectedDays);
      if (response.status === "success") {
        setMessage("Business hours saved successfully.");
        setMessageType("success");
        clearMessageAfterDelay();

        setSchedule(
          DAYS.map((day) => ({
            day_of_week: day.day_of_week,
            open_time: "",
            close_time: "",
            selected: false,
          })),
        );

        window.dispatchEvent(new CustomEvent("bookingUpdated"));
      } else {
        setMessage(response.message || "Failed to save business hours.");
        setMessageType("error");
        clearMessageAfterDelay();
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
      clearMessageAfterDelay();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="business-hours-container">
      <h6 className="text-primary mt-4 mb-4">Add Opening Hours</h6>

      <div className="card business-hours-card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="business-hours-layout">
              <div className="business-hours-form-side">
                {DAYS.map((day) => {
                  const currentSlot = schedule.find(
                    (item) => item.day_of_week === day.day_of_week,
                  );

                  return (
                    <div key={day.day_of_week} className="day-row">
                      <div className="day-checkbox">
                        <input
                          type="checkbox"
                          id={`day-${day.day_of_week}`}
                          checked={currentSlot.selected}
                          onChange={() => handleToggleDay(day.day_of_week)}
                        />
                        <label htmlFor={`day-${day.day_of_week}`}>
                          {day.label}
                        </label>
                      </div>

                      <div className="time-inputs">
                        <input
                          type="time"
                          className="form-control"
                          value={currentSlot.open_time}
                          disabled={!currentSlot.selected}
                          required={currentSlot.selected}
                          onChange={(e) =>
                            handleTimeChange(
                              day.day_of_week,
                              "open_time",
                              e.target.value,
                            )
                          }
                        />
                        <span>to</span>
                        <input
                          type="time"
                          className="form-control"
                          value={currentSlot.close_time}
                          disabled={!currentSlot.selected}
                          required={currentSlot.selected}
                          onChange={(e) =>
                            handleTimeChange(
                              day.day_of_week,
                              "close_time",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="business-hours-info-side">
                <p>
                  When updating your opening days or hours, please enter the
                  complete weekly schedule. Your current opening days and hours
                  will be replaced with the information you enter.
                </p>
                <p>For example, if your current opening days and hours are:</p>
                <ul>
                  <li>Monday: 08:00 - 17:00</li>
                  <li>Tuesday: 08:00 - 17:00</li>
                </ul>
                <p>and you want to add Wednesday, enter:</p>
                <ul>
                  <li>Monday: 08:00 - 17:00</li>
                  <li>Tuesday: 08:00 - 17:00</li>
                  <li>Wednesday: 08:00 - 17:00</li>
                </ul>
                <p className="mb-0">
                  Do not enter only the day you want to change or add. Any days
                  not included will be removed from the new schedule.
                </p>
              </div>
            </div>

            {message && (
              <div
                className={`mt-3 ${
                  messageType === "success"
                    ? "success-message-system"
                    : "error-message-system"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary mt-3"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Hours"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BusinessHoursManager;
