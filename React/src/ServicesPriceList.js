import React from "react";
import "./ServicesPriceList.css";

const servicesData = [
  {
    name: "MOT Testing (Class 4)",
    description: "Annual legal safety inspection for cars and light vehicles.",
    duration: "60 min",
    price: "£45 - £55",
  },
  {
    name: "Interim Car Service",
    description:
      "Basic check-up for high-mileage cars, covering essential fluids and filters.",
    duration: "60 min",
    price: "£90 - £150",
  },
  {
    name: "Full Car Service",
    description:
      "Comprehensive service including oil change, filter replacements, and full safety check.",
    duration: "120 min",
    price: "£160 - £260",
  },
  {
    name: "Major Car Service",
    description:
      "Extensive service replacing spark plugs, fuel filters, and detailed component inspection.",
    duration: "180 min",
    price: "£250 - £420",
  },
  {
    name: "Brake Replacement (Front or Rear)",
    description:
      "Inspection and replacement of brake pads and discs to ensure stopping safety.",
    duration: "120 min",
    price: "£150 - £350",
  },
  {
    name: "Diagnostics Check",
    description:
      "Computerised fault finding to identify engine warning lights and performance issues.",
    duration: "60 min",
    price: "£50 - £90",
  },
  {
    name: "Air Conditioning Regas & Service",
    description:
      "Regas and antibacterial treatment to restore cold air and remove odours.",
    duration: "60 min",
    price: "£70 - £120",
  },
  {
    name: "Suspension & Steering Repairs",
    description:
      "Repair or replacement of shocks, struts, and steering components for a smooth ride.",
    duration: "120 min",
    price: "£120 - £300",
  },
  {
    name: "Tyre Replacement & Balancing",
    description: "Fitting of new tyres, balancing, and disposal of old units.",
    duration: "60 min",
    price: "£120 - £250",
  },
  {
    name: "Wheel Alignment",
    description:
      "Precision adjustment of wheel angles to prevent uneven tyre wear.",
    duration: "60 min",
    price: "£45 - £80",
  },
  {
    name: "Exhaust Repair / Replacement",
    description:
      "Repair or replacement of exhaust pipes, silencers, and catalytic converters.",
    duration: "120 min",
    price: "£100 - £350",
  },
  {
    name: "Timing Belt (Cambelt) Replacement",
    description:
      "Critical replacement of the cambelt to prevent engine failure.",
    duration: "240 min",
    price: "£350 - £650",
  },
];

function ServicesPriceList() {
  return (
    <div className="services-price-card w-100 mb-4">
      <div className="services-list">
        {servicesData.map((service, index) => (
          <div
            key={index}
            className="row services-list-item align-items-center py-3 mx-0"
          >
            <div className="col-12 col-md-7 service-info mb-2 mb-md-0 px-0">
              <span className="service-name">{service.name}</span>
              <span className="service-description">{service.description}</span>
            </div>

            <div className="col-6 col-md-2 text-start text-md-center service-duration-wrapper px-0">
              <span className="service-duration-badge">{service.duration}</span>
            </div>

            <div className="col-6 col-md-3 text-end service-price-wrapper px-0">
              <span className="service-price">{service.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServicesPriceList;
