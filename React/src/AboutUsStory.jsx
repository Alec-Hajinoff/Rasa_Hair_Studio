import React from "react";
import "./AboutUsStory.css";

function AboutUsStory() {
  return (
    <div className="story-card mb-4">
      <h2 className="story-heading">Motoring Heritage</h2>
      <p className="story-text">
        Situated at 50a Southbury Road, Loveday Auto Repairs is a landmark local
        fixture with a rich history. While the building itself carries nearly a
        century of local automotive heritage, the garage has been proudly
        steered under its current stewardship for the last four decades.
      </p>
      <p className="story-text">
        Over that time, we have witnessed generations of cars change and evolve,
        yet our foundational commitment to honest graft, traditional values, and
        dependable service has never wavered.
      </p>

      <h2 className="story-heading">Experience You Can Trust</h2>
      <p className="story-text">
        At the heart of the garage are Mike and Darren—seasoned mechanics who
        bring decades of hands-on expertise to every ramp. Unlike large,
        faceless fast-fit operations where vehicles are processed like queue
        tickets, Mike and Darren know their trade inside out.
      </p>
      <p className="story-text">
        They combine old-school mechanical intuition with up-to-date diagnostic
        capabilities, meaning they can accurately pinpoint and fix faults that
        baffle newer or larger franchise outfits.
      </p>

      <h2 className="story-heading">Proper Care</h2>
      <p className="story-text">
        We believe that looking after your car shouldn't mean dealing with
        hidden extras, unnecessary upsells, or corporate jargon. When you bring
        your vehicle to Loveday Auto Repairs:
      </p>

      <ul className="list-unstyled story-list">
        <li>
          <strong>You deal with the people actually doing the work:</strong> We
          take the time to talk you through what needs doing, explaining things
          clearly and honestly.
        </li>
        <li>
          <strong>Your car is treated as an individual:</strong> We care for
          your vehicle with the same diligence we would apply to our own,
          ensuring safe, reliable motoring.
        </li>
        <li>
          <strong>Fair, transparent pricing:</strong> By keeping our overheads
          sensible and our standards high, we deliver top-tier workmanship
          without main-dealer or corporate price tags.
        </li>
      </ul>

      <p className="story-text story-cta mb-0">
        Whether it's routine servicing, an MOT alignment, diagnostics, or
        unexpected repairs, we are here to keep Enfield moving safely. Drop by
        the garage or book online by clicking 'Book an Appointment' below -
        we're always happy to help.
      </p>
    </div>
  );
}

export default AboutUsStory;
