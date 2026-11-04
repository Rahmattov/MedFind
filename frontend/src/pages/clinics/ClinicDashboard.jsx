
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function ClinicDashboard() {
  const { patient, loading: authLoading } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState("");
  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [reviews, setReviews] = useState({});
  const [reviewLoading, setReviewLoading] = useState(null);
  const [reviewForms, setReviewForms] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState(null);
  const [reviewMessages, setReviewMessages] = useState({});

  const role = (
    patient?.role ?? patient?.roles?.[0] ?? ""
  ).toLowerCase();

  const isManager = role === "clinicmanager";
  const isAdmin = role === "admin";
  const isPatient = role === "patient";
  const hasAccess = Boolean(patient) &&
    (isManager || isAdmin || isPatient);

  const token = () => localStorage.getItem("medfind_access_token");

  const loadAppointments = useCallback(async () => {
    const accessToken = token();

    if (!accessToken) {
      setAppointmentError("Please log in to access appointments.");
      setAppointmentLoading(false);
      return;
    }

    setAppointmentLoading(true);
    setAppointmentError("");

    try {
      const response = await fetch(`${API}/appointments/clinic`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || data?.title ||
          "Could not load clinic appointments."
        );
      }

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setAppointmentError(err.message || "Failed to load appointments.");
    } finally {
      setAppointmentLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    setDoctorLoading(true);
    setDoctorError("");

    try {
      const response = await fetch(
        `${API}/doctors?page=1&pageSize=50`,
        {
          headers: { Accept: "application/json" },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || data?.title ||
          "Could not load doctors."
        );
      }

      setDoctors(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      setDoctorError(err.message || "Failed to load doctors.");
    } finally {
      setDoctorLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!hasAccess) {
      setDoctorLoading(false);
      setAppointmentLoading(false);
      return;
    }

    loadDoctors();

    if (isManager || isAdmin) {
      loadAppointments();
    } else {
      setAppointmentLoading(false);
    }
  }, [
    authLoading,
    hasAccess,
    isManager,
    isAdmin,
    loadDoctors,
    loadAppointments,
  ]);

  async function updateAppointment(appointment, action) {
    const accessToken = token();

    if (!accessToken) {
      setAppointmentError("Please log in again.");
      return;
    }

    let body;

    if (action === "reject") {
      const reason = window.prompt(
        "Enter the reason for rejecting this appointment:"
      );

      if (reason === null) return;

      if (!reason.trim() || reason.trim().length > 500) {
        setAppointmentError(
          "The rejection reason must contain 1–500 characters."
        );
        return;
      }

      body = JSON.stringify({ reason: reason.trim() });
    }

    setBusyId(appointment.id);
    setAppointmentError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/appointments/${appointment.id}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
            Accept: "application/json",
          },
          ...(body ? { body } : {}),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || data?.title ||
          "Could not update the appointment."
        );
      }

      setMessage(
        action === "confirm"
          ? "Appointment confirmed successfully."
          : "Appointment rejected successfully."
      );

      await loadAppointments();
    } catch (err) {
      setAppointmentError(err.message || "Failed to update appointment.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleReviews(doctorId) {
    if (expandedDoctor === doctorId) {
      setExpandedDoctor(null);
      return;
    }

    setExpandedDoctor(doctorId);

    if (reviews[doctorId]) return;

    setReviewLoading(doctorId);

    try {
      const response = await fetch(
        `${API}/doctors/${doctorId}/reviews`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Could not load reviews."
        );
      }

      setReviews((current) => ({
        ...current,
        [doctorId]: data,
      }));
    } catch (err) {
      setReviewMessages((current) => ({
        ...current,
        [doctorId]: err.message,
      }));
    } finally {
      setReviewLoading(null);
    }
  }

  function updateReviewForm(doctorId, field, value) {
    setReviewForms((current) => ({
      ...current,
      [doctorId]: {
        rating: 5,
        comment: "",
        ...current[doctorId],
        [field]: value,
      },
    }));
  }

  async function submitReview(doctorId) {
    const accessToken = token();
    const form = reviewForms[doctorId] || {
      rating: 5,
      comment: "",
    };

    if (!accessToken) {
      setReviewMessages((current) => ({
        ...current,
        [doctorId]: "Please log in to leave a review.",
      }));
      return;
    }

    if (!form.comment.trim()) {
      setReviewMessages((current) => ({
        ...current,
        [doctorId]: "Please write a comment.",
      }));
      return;
    }

    setReviewSubmitting(doctorId);
    setReviewMessages((current) => ({
      ...current,
      [doctorId]: "",
    }));

    try {
      const response = await fetch(
        `${API}/doctors/${doctorId}/reviews`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            rating: form.rating,
            comment: form.comment.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || data?.title ||
          "Could not submit your review."
        );
      }

      setReviewForms((current) => ({
        ...current,
        [doctorId]: { rating: 5, comment: "" },
      }));

      setReviewMessages((current) => ({
        ...current,
        [doctorId]: "Thank you! Your review has been published.",
      }));

      // Refresh reviews and doctor rating.
      setReviews((current) => {
        const next = { ...current };
        delete next[doctorId];
        return next;
      });

      const reviewResponse = await fetch(
        `${API}/doctors/${doctorId}/reviews`
      );

      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json();
        setReviews((current) => ({
          ...current,
          [doctorId]: reviewData,
        }));
      }

      await loadDoctors();
    } catch (err) {
      setReviewMessages((current) => ({
        ...current,
        [doctorId]: err.message || "Failed to submit review.",
      }));
    } finally {
      setReviewSubmitting(null);
    }
  }

  if (authLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-10">Loading...</main>;
  }

  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold text-brand-900">
          Access restricted
        </h1>
        <p className="mt-3 text-slate-600">
          Please log in to access the clinic dashboard.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-block text-brand-700 underline"
        >
          Log in
        </Link>
      </main>
    );
  }

  const pendingCount = appointments.filter(
    (item) => normalizeStatus(item.status) === "pending"
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/dashboard" className="text-sm text-brand-700 hover:underline">
        ← Dashboard
      </Link>

      {/* Available doctors */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mt-1 text-sm text-slate-500">
              Verified specialists available on MedFind.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDoctors}
            disabled={doctorLoading}
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold hover:bg-white disabled:opacity-50"
          >
            Refresh doctors
          </button>
        </div>

        {doctorError && (
          <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
            {doctorError}
          </div>
        )}

        {doctorLoading ? (
          <p className="mt-6 rounded-xl bg-white p-6">Loading doctors...</p>
        ) : doctors.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-8">
            <h3 className="font-semibold text-brand-900">
              No verified doctors found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Verified doctors will appear here when available.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {doctors.map((doctor) => {
              const doctorId = doctor.id;
              const doctorReviews = reviews[doctorId];
              const form = reviewForms[doctorId] || {
                rating: 5,
                comment: "",
              };

              const specialties = doctor.specialties || [];
              const clinics = doctor.clinics || [];

              const specialtyNames = specialties.map((item) =>
                typeof item === "string" ? item : item.name
              ).filter(Boolean);

              const clinicNames = clinics.map((item) =>
                typeof item === "string" ? item : item.name
              ).filter(Boolean);

              return (
                <article
                  key={doctorId}
                  className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {doctor.photoUrl ? (
                        <img
                          src={doctor.photoUrl}
                          alt={doctor.fullName}
                          className="h-20 w-20 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-800">
                          {(doctor.fullName || "D").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold text-brand-900">
                          {doctor.fullName || "Doctor"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          {specialtyNames.join(", ") || "Specialist"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {doctor.experienceYears ?? 0} years of experience
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {clinicNames.map((name, index) => (
                        <span
                          key={`${name}-${index}`}
                          className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          Consultation price
                        </p>
                        <p className="mt-1 font-bold text-brand-900">
                          {doctor.consultationPrice != null
                            ? `${Number(doctor.consultationPrice).toLocaleString()} ₸`
                            : "Not specified"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500">Rating</p>
                        <p className="mt-1 font-bold text-amber-600">
                          ★ {Number(doctor.averageRating || 0).toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        to={`/doctor/${doctorId}`}
                        className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
                      >
                        View profile
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleReviews(doctorId)}
                        className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-brand-900 hover:bg-stone-50"
                      >
                        {expandedDoctor === doctorId
                          ? "Hide reviews"
                          : "Read reviews"}
                      </button>
                    </div>
                  </div>

                  {expandedDoctor === doctorId && (
                    <div className="border-t border-stone-200 bg-stone-50 p-6">
                      <h4 className="font-bold text-brand-900">
                        Patient Reviews
                      </h4>

                      {reviewLoading === doctorId ? (
                        <p className="mt-4 text-sm text-slate-500">
                          Loading reviews...
                        </p>
                      ) : doctorReviews ? (
                        <>
                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-2xl font-bold text-amber-600">
                              ★ {Number(
                                doctorReviews.averageRating || 0
                              ).toFixed(1)}
                            </span>
                            <span className="text-sm text-slate-500">
                              {doctorReviews.reviewCount || 0} reviews
                            </span>
                          </div>

                          {doctorReviews.reviews?.length > 0 ? (
                            <div className="mt-4 space-y-3">
                              {doctorReviews.reviews.map((review) => (
                                <div
                                  key={review.id}
                                  className="rounded-xl border border-stone-200 bg-white p-4"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-brand-900">
                                      {review.patientName || "Patient"}
                                    </p>
                                    <span className="text-amber-500">
                                      {"★".repeat(review.rating)}
                                      <span className="text-slate-300">
                                        {"★".repeat(5 - review.rating)}
                                      </span>
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm text-slate-600">
                                    {review.comment}
                                  </p>

                                  <p className="mt-2 text-xs text-slate-400">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-slate-500">
                              No reviews yet. Be the first to review this doctor.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-3 text-sm text-red-600">
                          {reviewMessages[doctorId] || "Could not load reviews."}
                        </p>
                      )}

                      {isPatient && (
                        <div className="mt-6 border-t border-stone-200 pt-5">
                          <h4 className="font-semibold text-brand-900">
                            Leave your review
                          </h4>

                          <p className="mt-2 text-sm text-slate-600">
                            Your rating
                          </p>

                          <div className="mt-2 flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  updateReviewForm(doctorId, "rating", star)
                                }
                                aria-label={`Rate ${star} out of 5`}
                                className={`text-3xl ${
                                  star <= form.rating
                                    ? "text-amber-500"
                                    : "text-slate-300"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>

                          <textarea
                            value={form.comment}
                            onChange={(event) =>
                              updateReviewForm(
                                doctorId,
                                "comment",
                                event.target.value
                              )
                            }
                            maxLength={2000}
                            rows={3}
                            placeholder="Share your experience with this doctor..."
                            className="mt-4 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-brand-700"
                          />

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-slate-400">
                              {form.comment.length}/2000 characters
                            </span>

                            <button
                              type="button"
                              disabled={
                                reviewSubmitting === doctorId ||
                                !form.comment.trim()
                              }
                              onClick={() => submitReview(doctorId)}
                              className="rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {reviewSubmitting === doctorId
                                ? "Submitting..."
                                : "Submit review"}
                            </button>
                          </div>

                          {reviewMessages[doctorId] && (
                            <p
                              role="status"
                              className="mt-3 text-sm text-brand-800"
                            >
                              {reviewMessages[doctorId]}
                            </p>
                          )}
                        </div>
                      )}

                      {!isPatient && (
                        <p className="mt-5 text-sm text-slate-500">
                          Log in with a patient account to leave a review.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Appointment management: clinic managers and admins only */}
      {(isManager || isAdmin) && (
        <section className="mt-14 border-t border-stone-200 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                Clinic Management
              </p>
              <h2 className="mt-2 text-3xl font-bold text-brand-900">
                Appointment Requests
              </h2>
              <p className="mt-2 text-slate-500">
                Review patient requests and manage appointment confirmations.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAppointments}
              disabled={appointmentLoading}
              className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold hover:bg-white disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-900">Awaiting confirmation</p>
            <p className="mt-1 text-3xl font-bold text-amber-900">
              {pendingCount}
            </p>
          </div>

          {message && (
            <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-green-800">
              {message}
            </p>
          )}

          {appointmentError && (
            <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
              {appointmentError}
            </div>
          )}

          {appointmentLoading ? (
            <p className="mt-6 rounded-xl bg-white p-6">
              Loading appointments...
            </p>
          ) : appointments.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-brand-900">
                No appointment requests yet
              </h3>
              <p className="mt-2 text-slate-500">
                New patient bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {appointments.map((appointment) => {
                const status = normalizeStatus(appointment.status);
                const pending = status === "pending";

                return (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">
                          {formatDate(appointment.date)} ·{" "}
                          {appointment.startTime}–{appointment.endTime}
                        </p>

                        <h3 className="mt-2 text-xl font-semibold text-brand-900">
                          {appointment.patientName || "Patient"}
                        </h3>

                        <p className="mt-1 text-slate-600">
                          Doctor: {appointment.doctorName || "Not specified"}
                        </p>

                        {appointment.patientPhone && (
                          <p className="mt-1 text-sm text-slate-600">
                            Phone: {appointment.patientPhone}
                          </p>
                        )}

                        {appointment.reason && (
                          <p className="mt-3 text-sm text-slate-600">
                            <strong>Reason:</strong> {appointment.reason}
                          </p>
                        )}

                        {appointment.cancelReason && (
                          <p className="mt-2 text-sm text-red-700">
                            <strong>Rejection reason:</strong>{" "}
                            {appointment.cancelReason}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyle(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                    </div>

                    {pending && (
                      <div className="mt-5 flex flex-wrap gap-3 border-t border-stone-100 pt-4">
                        <button
                          type="button"
                          disabled={busyId === appointment.id}
                          onClick={() => updateAppointment(appointment, "confirm")}
                          className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                        >
                          {busyId === appointment.id
                            ? "Processing..."
                            : "Confirm appointment"}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === appointment.id}
                          onClick={() => updateAppointment(appointment, "reject")}
                          className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function normalizeStatus(status) {
  const names = {
    0: "pending",
    1: "confirmed",
    2: "completed",
    3: "cancelled",
    4: "rejected",
    5: "no-show",
  };

  if (typeof status === "number" || /^\d+$/.test(String(status))) {
    return names[status] || "unknown";
  }

  const value = String(status ?? "").toLowerCase();

  if (value === "cancelledbypatient") return "cancelled";
  if (value === "cancelledbydoctor") return "rejected";
  if (value === "noshow") return "no-show";

  return value;
}

function statusLabel(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled by patient",
    rejected: "Rejected by clinic",
    "no-show": "No-show",
  };

  return labels[status] || status;
}

function statusStyle(status) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
    rejected: "bg-red-100 text-red-800",
    "no-show": "bg-slate-100 text-slate-700",
  };

  return styles[status] || "bg-slate-100 text-slate-700";
}

function formatDate(value) {
  if (!value) return "Date not specified";

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
