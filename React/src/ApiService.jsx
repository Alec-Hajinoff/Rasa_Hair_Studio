const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const registerUser = async (formData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/form_capture.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/login_capture.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/logout_component.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/verify_email.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/password_reset_link.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/password_reset_token.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/update_password.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/check_session.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/service_manager.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/customer_profile_get.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/customer_profile_post.php`,
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
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/customer_delete_account.php`,
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

// adminServicesListGet() retrieves all services for the admin dashboard.

export const adminServicesListGet = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_services_list_get.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching services list:", error);
    throw new Error("An error occurred while loading services.");
  }
};

// adminServicesListPost() updates an existing services.

export const adminServicesListPost = async (serviceData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_services_list_post.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(serviceData),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating service:", error);
    throw new Error("An error occurred while updating the service.");
  }
};

// servicesPriceList() fetches active services for the public price list.

export const servicesPriceList = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/services_price_list.php`,
      {
        method: "GET",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching services price list:", error);
    throw new Error("An error occurred while loading services.");
  }
};

// adminGalleryImages() uploads multiple gallery images to the backend.

export const adminGalleryImages = async (formData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_gallery_images.php`,
      {
        method: "POST",

        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading gallery images:", error);
    throw new Error("An error occurred while uploading images.");
  }
};

// adminGalleryImagesManagerGet() fetchs all gallery records.

export const adminGalleryImagesManagerGet = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_gallery_images_manager_get.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load gallery images.");
    }

    return data;
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    throw new Error(error.message || "An error occurred while loading images.");
  }
};

// adminGalleryImagesManagerPost() allows admins to update image title or delete image.

export const adminGalleryImagesManagerPost = async (imageData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_gallery_images_manager_post.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(imageData),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gallery image request failed.");
    }

    return data;
  } catch (error) {
    console.error("Error updating or deleting gallery image:", error);
    throw new Error(
      error.message || "An error occurred while processing the image.",
    );
  }
};

// galleryImages() fetches all active gallery images for the public gallery page.

export const galleryImages = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/gallery_images.php`,
      {
        method: "GET",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    throw new Error("An error occurred while loading gallery images.");
  }
};

// adminBlogEntry() allows admins to write a blog entry.

export const adminBlogEntry = async (formData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_blog_entry.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "The blog post could not be saved.");
    }

    return data;
  } catch (error) {
    console.error("Error saving blog post:", error);
    throw new Error(
      error.message || "An error occurred while saving the post.",
    );
  }
};

// adminBlogManagerGet() retrieves all blog posts for the admin manager.

export const adminBlogManagerGet = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_blog_manager_get.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Failed to load blog posts.");
    }

    return data;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error(
      error.message || "An error occurred while loading blog posts.",
    );
  }
};

// adminBlogManagerPost() allows admins to delete a blog post and its featured image.

export const adminBlogManagerPost = async (postData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_blog_manager_post.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(postData),
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "The blog post could not be deleted.");
    }

    return data;
  } catch (error) {
    console.error("Error deleting blog post:", error);
    throw new Error(
      error.message || "An error occurred while deleting the blog post.",
    );
  }
};

// blog() displays blog entries on the public blog page, with the most recent post first.

export const blog = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/blog.php`,
      {
        method: "GET",
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Failed to load blog posts.");
    }

    return data.posts;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error(
      error.message || "An error occurred while loading blog posts.",
    );
  }
};

// testimonialCarousel() retrieves Google reviews for display in the testimonial carousel on the homepage.

export const testimonialCarousel = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/testimonial_carousel.php`,
      {
        method: "GET",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to load Google reviews.");
    }

    return data;
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    throw new Error(
      error.message || "An error occurred while loading reviews.",
    );
  }
};

// adminCreateProduct() allows admins to create a new product for the shop.

export const adminCreateProduct = async (formData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_create_product.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "The product could not be saved.");
    }

    return data;
  } catch (error) {
    console.error("Error saving product:", error);
    throw new Error(
      error.message || "An error occurred while saving the product.",
    );
  }
};

// adminManageProductsGet() displays all products in the admin dashboard, with the most recent product first.

export const adminManageProductsGet = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_manage_products_get.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Products could not be loaded.");
    }

    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error(
      error.message || "An error occurred while loading products.",
    );
  }
};

// adminManageProductsPost() allows admins to delete a product and its associated image.

export const adminManageProductsPost = async (productData) => {
  const requestData =
    typeof productData === "object" && productData !== null
      ? productData
      : { action: "delete", id: productData };

  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_manage_products_post.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(
        data.message || "The product request could not be completed.",
      );
    }

    return data;
  } catch (error) {
    console.error("Error managing product:", error);
    throw new Error(
      error.message || "An error occurred while managing the product.",
    );
  }
};

// shopGetProducts() fetches products for the public shop page, with the most recent product first.

export const shopGetProducts = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/shop_get_products.php`,
      {
        method: "GET",
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Products could not be loaded.");
    }

    return data.products;
  } catch (error) {
    console.error("Error fetching shop products:", error);
    throw new Error(
      error.message || "An error occurred while loading products.",
    );
  }
};

// shopCreateCheckoutSession() initiates a Stripe Checkout Session for the items in the user's basket and returns the session URL.

export const shopCreateCheckoutSession = async (items, deliveryChargePence) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/shop_create_checkout_session.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          delivery_charge_pence: deliveryChargePence,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success" || !data.url) {
      throw new Error(data.message || "Checkout could not be started.");
    }

    return data;
  } catch (error) {
    console.error("Error creating Stripe Checkout Session:", error);
    throw new Error(
      error.message || "An error occurred while starting checkout.",
    );
  }
};

// deliveryChargeGet() reads the current delivery fee from the PHP endpoint.

export const deliveryChargeGet = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/delivery_charge_get.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (
      !response.ok ||
      data.success !== true ||
      !Number.isSafeInteger(data.delivery_charge_pence) ||
      data.delivery_charge_pence < 0
    ) {
      throw new Error(
        data.message || "The delivery charge could not be loaded.",
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching delivery charge:", error);
    throw new Error(
      error.message || "An error occurred while loading the delivery charge.",
    );
  }
};

// adminShopOrders() retrieves transactions and their items for the admin orders view.

export const adminShopOrders = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/admin_shop_orders.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Shop orders could not be loaded.");
    }

    return data;
  } catch (error) {
    console.error("Error fetching shop orders:", error);
    throw new Error(
      error.message || "An error occurred while loading shop orders.",
    );
  }
};

// customerShopOrders() fetches customer's shop orders and their items for the user dashboard.

export const customerShopOrders = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Rasa_Hair_Studio/PHP/customer_shop_orders.php`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Shop orders could not be loaded.");
    }

    return data;
  } catch (error) {
    console.error("Error fetching customer shop orders:", error);
    throw new Error(
      error.message || "An error occurred while loading your shop orders.",
    );
  }
};
