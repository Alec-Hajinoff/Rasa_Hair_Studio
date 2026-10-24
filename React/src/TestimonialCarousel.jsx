import React, { useEffect, useState } from "react";
import { testimonialCarousel } from "./ApiService";
import "./TestimonialCarousel.css";

function TestimonialCarousel() {
  const [reviewData, setReviewData] = useState({
    rating: null,
    userRatingCount: null,
    googleMapsUri: "",
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    testimonialCarousel()
      .then((data) => {
        if (isMounted) {
          setReviewData(data);
        }
      })
      .catch((fetchError) => {
        if (isMounted) {
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reviews = reviewData.reviews || [];

  return (
    <section className="testimonial-section py-4">
      <div className="text-center mb-4">
        <h2 className="testimonial-section-title">What Our Customers Say</h2>

        {reviewData.rating !== null && (
          <p className="testimonial-business-rating">
            {reviewData.rating} out of 5
            {reviewData.userRatingCount
              ? ` · ${reviewData.userRatingCount} Google ratings`
              : ""}
            {reviewData.googleMapsUri && (
              <>
                {" · "}
                <a
                  href={reviewData.googleMapsUri}
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Maps
                </a>
              </>
            )}
          </p>
        )}
      </div>

      {loading && (
        <p className="testimonial-status" role="status">
          Loading reviews…
        </p>
      )}

      {!loading && error && (
        <p className="testimonial-status testimonial-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && reviews.length === 0 && (
        <p className="testimonial-status">No Google reviews are available.</p>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div
          id="googleTestimonialCarousel"
          className="carousel slide testimonial-carousel-container"
          data-bs-ride={reviews.length > 1 ? "carousel" : undefined}
          data-bs-interval="5000"
        >
          <div className="carousel-inner">
            {reviews.map((item, index) => (
              <div
                key={`${item.authorName}-${index}`}
                className={`carousel-item ${index === 0 ? "active" : ""}`}
              >
                <article className="testimonial-card">
                  <div
                    className="testimonial-stars mb-3"
                    aria-label={`${item.rating} out of 5 stars`}
                  >
                    {"★".repeat(
                      Math.max(0, Math.min(5, Math.round(item.rating))),
                    )}
                    {"☆".repeat(
                      5 - Math.max(0, Math.min(5, Math.round(item.rating))),
                    )}
                  </div>

                  <p className="testimonial-text mb-4">
                    {item.text ||
                      "This reviewer did not leave written feedback."}
                  </p>

                  <div className="testimonial-author-info">
                    {item.authorPhotoUri && (
                      <img
                        className="testimonial-author-photo"
                        src={item.authorPhotoUri}
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <h3 className="testimonial-author-name">
                      {item.authorUri ? (
                        <a
                          href={item.authorUri}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.authorName}
                        </a>
                      ) : (
                        item.authorName
                      )}
                    </h3>
                    {item.publishedAt && (
                      <span className="testimonial-review-date">
                        {item.publishedAt}
                      </span>
                    )}
                    {item.googleMapsUri && (
                      <a
                        className="testimonial-review-link"
                        href={item.googleMapsUri}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on Google Maps
                      </a>
                    )}
                  </div>

                  <p className="testimonial-attribution">
                    Reviews from Google Maps
                  </p>
                </article>
              </div>
            ))}
          </div>

          {reviews.length > 1 && (
            <>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#googleTestimonialCarousel"
                data-bs-slide="prev"
                aria-label="Previous review"
              >
                <span
                  className="carousel-control-prev-icon"
                  aria-hidden="true"
                />
              </button>
              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#googleTestimonialCarousel"
                data-bs-slide="next"
                aria-label="Next review"
              >
                <span
                  className="carousel-control-next-icon"
                  aria-hidden="true"
                />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default TestimonialCarousel;
