import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./AdminStylistProfileManager.css";
import {
  adminStylistProfileManagerGet,
  adminStylistProfileManagerPost,
} from "./ApiService";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const IMAGE_EXTS = ["jpg", "jpeg", "png"];
const IMAGE_TYPES = ["image/jpeg", "image/png"];

const getExt = (name) => (name.split(".").pop() || "").toLowerCase();

const validateFile = (file) => {
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} exceeds the 2MB maximum file size.`;
  }

  const ext = getExt(file.name);
  if (!IMAGE_EXTS.includes(ext) || !IMAGE_TYPES.includes(file.type)) {
    return `${file.name} is not an allowed file type.`;
  }

  return null;
};

const buildFormFromStylist = (stylist) => ({
  name: stylist.name || "",
  biography: stylist.biography || "",
  experience: stylist.experience || "",
  qualifications: stylist.qualifications || "",
  isActive: Number(stylist.is_active) === 1,
  newProfileImage: null,
  removeProfileImage: false,
  certEdits: (stylist.certificates || []).reduce((acc, c) => {
    acc[c.id] = { title: c.title || "", markedForDeletion: false };
    return acc;
  }, {}),
  errors: {},
});

function AdminStylistProfileManager({ refreshKey }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [stylists, setStylists] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const profileImageInputRef = useRef(null);

  const loadStylists = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await adminStylistProfileManagerGet();

      if (data.status === "success") {
        setStylists(Array.isArray(data.stylists) ? data.stylists : []);
      } else {
        setLoadError(data.message || "Could not load stylists.");
      }
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStylists();
  }, [loadStylists, refreshKey]);

  const editingStylist = useMemo(
    () => stylists.find((s) => s.id === editingId) || null,
    [stylists, editingId],
  );

  const startEditing = (stylist) => {
    setFeedback(null);
    setEditingId(stylist.id);
    setForm(buildFormFromStylist(stylist));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(null);
    setFeedback(null);
  };

  const updateField = (patch) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateCertTitle = (certId, title) => {
    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        certEdits: {
          ...prev.certEdits,
          [certId]: { ...prev.certEdits[certId], title },
        },
      };
    });
  };

  const toggleCertDeletion = (certId) => {
    setForm((prev) => {
      if (!prev) return prev;

      const current = prev.certEdits[certId];

      return {
        ...prev,
        certEdits: {
          ...prev.certEdits,
          [certId]: {
            ...current,
            markedForDeletion: !current.markedForDeletion,
          },
        },
      };
    });
  };

  const onProfileImageChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      updateField({
        newProfileImage: null,
        errors: { ...form.errors, profileImage: undefined },
      });
      return;
    }

    const err = validateFile(file);

    if (err) {
      e.target.value = "";
      updateField({
        newProfileImage: null,
        errors: { ...form.errors, profileImage: err },
      });
      return;
    }

    updateField({
      newProfileImage: file,
      removeProfileImage: false,
      errors: { ...form.errors, profileImage: undefined },
    });
  };

  const validateForm = () => {
    const errs = {};

    if (!form.name.trim()) {
      errs.name = "Stylist name is required.";
    } else if (form.name.trim().length > 255) {
      errs.name = "Stylist name exceeds 255 characters.";
    }

    if (form.newProfileImage) {
      const err = validateFile(form.newProfileImage);
      if (err) errs.profileImage = err;
    }

    Object.entries(form.certEdits).forEach(([cid, c]) => {
      if (c.markedForDeletion) return;

      if (!c.title.trim()) {
        errs[`cert_${cid}`] = "Certificate title cannot be empty.";
      } else if (c.title.trim().length > 255) {
        errs[`cert_${cid}`] = "Certificate title exceeds 255 characters.";
      }
    });

    setForm((prev) => ({ ...prev, errors: errs }));
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!validateForm()) return;

    const fd = new FormData();
    fd.append("id", String(editingStylist.id));
    fd.append("name", form.name.trim());
    fd.append("biography", form.biography);
    fd.append("experience", form.experience);
    fd.append("qualifications", form.qualifications);
    fd.append("is_active", form.isActive ? "1" : "0");

    if (form.newProfileImage) {
      fd.append("profile_image", form.newProfileImage);
    } else if (form.removeProfileImage) {
      fd.append("remove_profile_image", "1");
    }

    Object.entries(form.certEdits).forEach(([cid, c]) => {
      if (c.markedForDeletion) {
        fd.append("cert_delete_ids[]", cid);
      } else {
        fd.append(`cert_titles[${cid}]`, c.title.trim());
      }
    });

    setSubmitting(true);

    try {
      const data = await adminStylistProfileManagerPost(fd);

      if (data.status === "success") {
        setFeedback({
          type: "success",
          text: data.message || "Stylist updated.",
        });

        if (profileImageInputRef.current) {
          profileImageInputRef.current.value = "";
        }

        setEditingId(null);
        setForm(null);
        await loadStylists();
      } else {
        setFeedback({ type: "error", text: data.message || "Save failed." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderCertificates = () => {
    if (!editingStylist) return null;

    const certs = editingStylist.certificates || [];

    if (certs.length === 0) {
      return <p className="text-muted mb-0">No certificates.</p>;
    }

    return (
      <ul className="list-group">
        {certs.map((c) => {
          const edit = form.certEdits[c.id];
          const marked = edit?.markedForDeletion;

          return (
            <li
              key={c.id}
              className={`list-group-item d-flex align-items-start gap-2 ${
                marked ? "cert-marked" : ""
              }`}
            >
              <div className="flex-grow-1">
                <label
                  className="form-label small mb-1"
                  htmlFor={`cert-title-${c.id}`}
                >
                  Title
                </label>

                <input
                  id={`cert-title-${c.id}`}
                  type="text"
                  className={`form-control form-control-sm ${
                    form.errors[`cert_${c.id}`] ? "is-invalid" : ""
                  }`}
                  value={edit?.title ?? ""}
                  maxLength={255}
                  disabled={marked}
                  onChange={(e) => updateCertTitle(c.id, e.target.value)}
                />

                {form.errors[`cert_${c.id}`] && (
                  <div className="invalid-feedback">
                    {form.errors[`cert_${c.id}`]}
                  </div>
                )}

                <small className="text-muted d-block mt-1">{c.file_path}</small>
              </div>

              <button
                type="button"
                className={`btn btn-sm ${
                  marked ? "btn-outline-secondary" : "btn-outline-danger"
                } align-self-center`}
                onClick={() => toggleCertDeletion(c.id)}
              >
                {marked ? "Undo" : "Mark for deletion"}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) {
    return <div className="stylist-manager">Loading stylists…</div>;
  }

  if (loadError) {
    return (
      <div className="stylist-manager">
        <div className="alert alert-danger" role="alert">
          {loadError}
        </div>

        <button className="btn btn-outline-dark" onClick={loadStylists}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="stylist-manager">
      <h4 className="mb-3">Stylist Profiles</h4>

      {feedback && (
        <div
          className={`alert ${
            feedback.type === "success" ? "alert-success" : "alert-danger"
          }`}
          role="alert"
        >
          {feedback.text}
        </div>
      )}

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {stylists.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted">
                  No stylists yet.
                </td>
              </tr>
            )}

            {stylists.map((s) => {
              const active = Number(s.is_active) === 1;

              return (
                <tr
                  key={s.id}
                  className={editingId === s.id ? "table-active" : ""}
                >
                  <td>{s.name}</td>

                  <td>
                    <span
                      className={`badge ${
                        active ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>{s.created_at}</td>

                  <td className="text-end">
                    {editingId === s.id ? (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={cancelEditing}
                      >
                        Editing…
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => startEditing(s)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {form && editingStylist && (
        <section className="edit-panel mt-4">
          <h5 className="mb-3">Edit: {editingStylist.name}</h5>

          <form onSubmit={handleSave} noValidate>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label" htmlFor="mgr-name">
                  Name <span className="text-danger">*</span>
                </label>

                <input
                  id="mgr-name"
                  type="text"
                  className={`form-control ${
                    form.errors.name ? "is-invalid" : ""
                  }`}
                  value={form.name}
                  maxLength={255}
                  onChange={(e) => updateField({ name: e.target.value })}
                />

                {form.errors.name && (
                  <div className="invalid-feedback">{form.errors.name}</div>
                )}
              </div>

              <div className="col-md-4">
                <label className="form-label d-block">Status</label>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="mgr-active"
                    name="mgr-status"
                    checked={form.isActive}
                    onChange={() => updateField({ isActive: true })}
                  />
                  <label className="form-check-label" htmlFor="mgr-active">
                    Active
                  </label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="mgr-inactive"
                    name="mgr-status"
                    checked={!form.isActive}
                    onChange={() => updateField({ isActive: false })}
                  />
                  <label className="form-check-label" htmlFor="mgr-inactive">
                    Inactive
                  </label>
                </div>
              </div>

              <div className="col-12">
                <label className="form-label">Profile Image</label>

                {editingStylist.profile_image_path &&
                  !form.removeProfileImage &&
                  !form.newProfileImage && (
                    <div className="mb-2">
                      <img
                        src={editingStylist.profile_image_path}
                        alt="Current profile"
                        className="profile-thumb"
                      />

                      <div className="form-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="mgr-remove-image"
                          checked={form.removeProfileImage}
                          onChange={(e) =>
                            updateField({
                              removeProfileImage: e.target.checked,
                              newProfileImage: null,
                            })
                          }
                        />

                        <label
                          className="form-check-label"
                          htmlFor="mgr-remove-image"
                        >
                          Remove current image
                        </label>
                      </div>
                    </div>
                  )}

                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className={`form-control ${
                    form.errors.profileImage ? "is-invalid" : ""
                  }`}
                  onChange={onProfileImageChange}
                />

                <div className="form-text">
                  JPG, JPEG or PNG. Max 2MB. Uploading replaces the current
                  image.
                </div>

                {form.errors.profileImage && (
                  <div className="invalid-feedback d-block">
                    {form.errors.profileImage}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="mgr-bio">
                  Biography
                </label>

                <textarea
                  id="mgr-bio"
                  className="form-control"
                  rows={4}
                  value={form.biography}
                  onChange={(e) => updateField({ biography: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="mgr-exp">
                  Experience
                </label>

                <textarea
                  id="mgr-exp"
                  className="form-control"
                  rows={4}
                  value={form.experience}
                  onChange={(e) => updateField({ experience: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="mgr-qual">
                  Qualifications
                </label>

                <textarea
                  id="mgr-qual"
                  className="form-control"
                  rows={4}
                  value={form.qualifications}
                  onChange={(e) =>
                    updateField({ qualifications: e.target.value })
                  }
                />
              </div>

              <div className="col-12">
                <label className="form-label">Certificates</label>
                {renderCertificates()}
              </div>

              <div className="col-12 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cancelEditing}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

export default AdminStylistProfileManager;
