import "./HeroSection.css";

function HeroSection() {
  return (
    <section className="hero-section-wrapper d-flex align-items-center">
      <div className="container text-center">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="hero-content mx-auto">
              <h1 className="hero-heading">
                Professional hair styling and treatments tailored to you.
              </h1>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
