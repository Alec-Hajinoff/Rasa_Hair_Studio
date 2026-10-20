import React, { useRef, useState } from "react";
import "./AdminStylistProfile.css";
import { adminStylistProfile } from "./ApiService";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const IMAGE_EXTS = ["jpg", "jpeg", "png"];
const IMAGE_TYPES = ["image/jpeg", "image/png"];
const CERT_EXTS = ["jpg", "jpeg", "png", "pdf"];
const CERT_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const getExt = (name) => (name.split(".").pop() || "").toLowerCase();

const validateFile = (file, allowedExts, allowedTypes, label) => {
  if (file.size > MAX_FILE_SIZE) {
    return `${label} exceeds the 2MB maximum file size.`;
  }
  const ext = getExt(file.name);
  if (!allowedExts.includes(ext) || !allowedTypes.includes(file.type)) {
    return `${label} is not an allowed file type.`;
  }
  return null;
};

const initialFormState = () => ({
  name: "",
  biography: "",
  experience: "",
  qualifications: "",

  profileImage: null,
  certificates: [],
  errors: {},
});

function AdminStylistProfile() {
  const [form, setForm] = useState(initialFormState());
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const profileImageInputRef = useRef(null);
  const certificatesInputRef = useRef(null);

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const updateError = (key, message) => {
    setForm((prev) => ({
      ...prev,
      errors: { ...prev.errors, [key]: message },
    }));
  };

  const onProfileImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFeedback(null);
    if (!file) {
      update({ profileImage: null });
      updateError("profileImage", undefined);
      return;
    }
    const err = validateFile(file, IMAGE_EXTS, IMAGE_TYPES, file.name);
    if (err) {
      e.target.value = "";
      update({ profileImage: null });
      updateError("profileImage", err);
      return;
    }
    update({ profileImage: file });
    updateError("profileImage", undefined);
  };

  const onCertificatesChange = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;

    const errors = [];
    const valid = [];
    picked.forEach((file) => {
      const err = validateFile(file, CERT_EXTS, CERT_TYPES, file.name);
      if (err) errors.push(err);
      else valid.push(file);
    });

    setForm((prev) => ({
      ...prev,
      certificates: [...prev.certificates, ...valid],
      errors: {
        ...prev.errors,
        certificates: errors.length ? errors.join(" ") : undefined,
      },
    }));
  };

  const removeCertificateAt = (index) => {
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Stylist name is required.";
    else if (form.name.trim().length > 255)
      errs.name = "Stylist name exceeds 255 characters.";

    if (form.profileImage) {
      const err = validateFile(
        form.profileImage,
        IMAGE_EXTS,
        IMAGE_TYPES,
        form.profileImage.name,
      );
      if (err) errs.profileImage = err;
    }

    setForm((prev) => ({ ...prev, errors: { ...prev.errors, ...errs } }));
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (!validate()) return;

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("biography", form.biography);
    formData.append("experience", form.experience);
    formData.append("qualifications", form.qualifications);

    if (form.profileImage) formData.append("profile_image", form.profileImage);
    form.certificates.forEach((file) =>
      formData.append("certificates[]", file),
    );

    setSubmitting(true);
    try {
      const data = await adminStylistProfile(formData);
      if (data.status === "success") {
        setFeedback({ type: "success", text: data.message });
        setForm(initialFormState());

        if (profileImageInputRef.current)
          profileImageInputRef.current.value = "";
        if (certificatesInputRef.current)
          certificatesInputRef.current.value = "";
      } else if (data.status === "partial") {
        setFeedback({ type: "partial", text: data.message });
      } else {
        setFeedback({ type: "error", text: data.message || "Save failed." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFeedback = () =>
    feedback && (
      <div
        className={`alert mt-3 mb-0 ${
          feedback.type === "success"
            ? "alert-success"
            : feedback.type === "partial"
              ? "alert-warning"
              : "alert-danger"
        }`}
        role="alert"
      >
        {feedback.text}
      </div>
    );

  return (
    <div className="stylist-profile-admin">
      <h4 className="mb-3">Add Stylist Profile</h4>
      <p className="text-muted">
        Submit one stylist at a time. The form resets after a successful save so
        you can add the next stylist.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="sp-name" className="form-label">
              Stylist Name <span className="text-danger">*</span>
            </label>
            <input
              id="sp-name"
              type="text"
              className={`form-control ${form.errors.name ? "is-invalid" : ""}`}
              value={form.name}
              maxLength={255}
              onChange={(e) => update({ name: e.target.value })}
              required
            />
            {form.errors.name && (
              <div className="invalid-feedback">{form.errors.name}</div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="sp-image" className="form-label">
              Profile Image
            </label>
            <input
              id="sp-image"
              ref={profileImageInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className={`form-control ${form.errors.profileImage ? "is-invalid" : ""}`}
              onChange={onProfileImageChange}
            />
            <div className="form-text">JPG, JPEG or PNG. Max 2MB.</div>
            {form.errors.profileImage && (
              <div className="invalid-feedback d-block">
                {form.errors.profileImage}
              </div>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="sp-bio" className="form-label">
              Biography
            </label>
            <textarea
              id="sp-bio"
              className="form-control"
              rows={4}
              value={form.biography}
              onChange={(e) => update({ biography: e.target.value })}
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="sp-exp" className="form-label">
              Experience
            </label>
            <textarea
              id="sp-exp"
              className="form-control"
              rows={4}
              value={form.experience}
              onChange={(e) => update({ experience: e.target.value })}
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="sp-qual" className="form-label">
              Qualifications
            </label>
            <textarea
              id="sp-qual"
              className="form-control"
              rows={4}
              value={form.qualifications}
              onChange={(e) => update({ qualifications: e.target.value })}
            />
          </div>

          <div className="col-12">
            <label htmlFor="sp-certs" className="form-label">
              Certificates
            </label>
            <input
              id="sp-certs"
              ref={certificatesInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              className={`form-control ${form.errors.certificates ? "is-invalid" : ""}`}
              onChange={onCertificatesChange}
            />
            <div className="form-text">
              JPG, JPEG, PNG or PDF. Max 2MB each.
            </div>
            {form.errors.certificates && (
              <div className="invalid-feedback d-block">
                {form.errors.certificates}
              </div>
            )}

            {form.certificates.length > 0 && (
              <ul className="list-group mt-2">
                {form.certificates.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <span className="text-truncate">{f.name}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeCertificateAt(i)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-12">
            <button
              type="submit"
              className="btn btn-dark"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Stylist"}
            </button>

            {renderFeedback()}
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminStylistProfile;
