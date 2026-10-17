//Frontend - backend communication must happen over HTTPS on production

const BackendApi = "http://localhost:8001";

export const registerUser = async (formData) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/form_capture.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("An error occurred.");
  }
};

export const loginUser = async (formData) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/login_capture.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("An error occurred.");
  }
};

export const logoutUser = async () => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/logout_component.php`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Logout failed");
    }
  } catch (error) {
    console.error("Error during logout:", error);
    throw new Error("An error occurred during logout.");
  }
};

// verifyEmail() checks the token in the email against database and redirects to sign in.

export const verifyEmail = async (token) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/verify_email.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token: token }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying email:", error);
    throw new Error("An error occurred during email verification.");
  }
};

// passwordResetLink() sends a user's email address to the backend to send a password rest email.

export const passwordResetLink = async (email) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/password_reset_link.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: email }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("passwordResetLink error:", error);

    return { success: true };
  }
};

// passwordResetToken() verifies if a password reset token is valid and not expired.

export const passwordResetToken = async (token) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/password_reset_token.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token: token }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("passwordResetToken error:", error);
    return {
      valid: false,
      message: "An error occurred while verifying the token.",
    };
  }
};

// updatePassword() updates the user's password and clears the reset token.

export const updatePassword = async (token, newPassword) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/update_password.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token: token,
          password: newPassword,
        }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("updatePassword error:", error);
    return {
      success: false,
      message: "An error occurred while updating the password.",
    };
  }
};

// checkSession() makes the backend call to check if a session exists.

export const checkSession = async () => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/check_session.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking session:", error);
    return { authenticated: false };
  }
};

// serviceManager() sends garage services data to the backend

export const serviceManager = async (servicesData) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/service_manager.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ services: servicesData }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error saving services:", error);
    throw new Error("An error occurred while saving services.");
  }
};

// customerProfileGet() retrieves profile details of a customer (first_name, surname, phone)

export const customerProfileGet = async () => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/customer_profile_get.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw new Error("An error occurred while loading your profile.");
  }
};

// customerProfilePost() updates customer profile details

export const customerProfilePost = async (profileData) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/customer_profile_post.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileData),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("An error occurred while saving profile details.");
  }
};

// customerDeleteAccount() soft-deletes user profile data and destroys active session

export const customerDeleteAccount = async () => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/customer_delete_account.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw new Error("An error occurred while deleting your account.");
  }
};

// adminBookingsList() fetchs all garage bookings for Admin role

export const adminBookingsList = async () => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/admin_bookings_list.php`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching admin bookings list:", error);
    throw new Error("An error occurred while fetching garage bookings.");
  }
};

// adminCancelBooking() allows admins to cancel an appointment and notifies the customer via email

export const adminCancelBooking = async (appointmentId) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/admin_cancel_booking.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ appointment_id: appointmentId }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error cancelling booking as admin:", error);
    throw new Error("An error occurred while cancelling the booking.");
  }
};

// adminBookingCalendar() retrieves availability slots for the admin calendar view

export const adminBookingCalendar = async (startDate, endDate) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/admin_booking_calendar.php?start_date=${startDate}&end_date=${endDate}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching admin booking calendar:", error);
    throw new Error("An error occurred while loading the admin calendar.");
  }
};

// blockUnblockActionBar() allows admins to block and unblock booking slos

export const blockUnblockActionBar = async (slotIds, action = null) => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/block_unblock_action_bar.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          slot_ids: slotIds,
          action: action,
        }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error toggling slot statuses:", error);
    throw new Error("An error occurred while updating availability slots.");
  }
};

// availabilityHorizonExtender() generates 3 additional months of availability slots

export const availabilityHorizonExtender = async () => {
  try {
    const response = await fetch(
      `${BackendApi}/Rasa_Hair_Studio/PHP/availability_horizon_extender.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error extending availability horizon:", error);
    throw new Error("An error occurred while extending availability slots.");
  }
};
