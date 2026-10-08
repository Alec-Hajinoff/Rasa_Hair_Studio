import React from "react";
import "./TestimonialCarousel.css";

function TestimonialCarousel() {
  const testimonials = [
    {
      name: "Oliver",
      text: "Brilliant service from start to finish! They fitted me in for an urgent MOT and full service at short notice. Honest advice and very reasonable prices.",
    },
    {
      name: "Charlotte",
      text: "I've been taking my car to Loveday for years. Their free collection and delivery service makes getting repairs done completely stress-free. Exceptional workmanship!",
    },
    {
      name: "Thomas",
      text: "Top-tier garage. Transparent pricing with no hidden surprises when the bill arrived. My engine runs like an absolute dream now.",
    },
    {
      name: "Hannah",
      text: "Friendly, family-run atmosphere and extremely professional mechanics. They diagnosed a tricky electrical fault that another garage missed entirely.",
    },
    {
      name: "Arthur",
      text: "First-class experience! Prompt communication, excellent workmanship, and my car was returned sparkling clean inside and out. Highly recommended.",
    },
  ];

  return (
    <section className="testimonial-section py-4">
      <div className="text-center mb-4">
        <h2 className="testimonial-section-title">What Our Customers Say</h2>
      </div>

      <div
        id="lovedayTestimonialCarousel"
        className="carousel slide testimonial-carousel-container"
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        <div className="carousel-inner">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className={`carousel-item ${index === 0 ? "active" : ""}`}
            >
              <div className="testimonial-card">
                <div className="testimonial-stars mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      className="bi bi-star-fill me-1"
                      viewBox="0 0 16 16"
                    >
                      <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                    </svg>
                  ))}
                </div>
                <p className="testimonial-text mb-4">"{item.text}"</p>
                <div className="testimonial-author-info">
                  <h5 className="testimonial-author-name">{item.name}</h5>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#lovedayTestimonialCarousel"
          data-bs-slide="prev"
        >
          <span
            className="carousel-control-prev-icon"
            aria-hidden="true"
          ></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#lovedayTestimonialCarousel"
          data-bs-slide="next"
        >
          <span
            className="carousel-control-next-icon"
            aria-hidden="true"
          ></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </section>
  );
}

export default TestimonialCarousel;
