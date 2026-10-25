import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function Dashboard() {
  const { patient, loading, refreshProfile, logout } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState("");

  const role = (
    patient?.role ??
    patient?.roles?.[0] ??
    ""
  ).toLowerCase();

  const isDoctor = role === "doctor";

  useEffect(() => {
    if (!isDoctor) return;

    let active = true;

    async function loadDoctor() {
      setDoctorLoading(true);
      setDoctorError("");

      try {
        const token = localStorage.getItem("medfind_access_token");
        const response = await fetch(`${API_URL}/doctors/me`, {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.title ||
              "Could not load your doctor profile.",
          );
        }

        if (active) setDoctor(data);
      } catch (err) {
        if (active) setDoctorError(err.message);
      } finally {
        if (active) setDoctorLoading(false);
      }
    }

    loadDoctor();

    return () => {
      active = false;
    };
  }, [isDoctor]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        Loading your account...
      </div>
    );
  }

  if (isDoctor) {
    const fullName =
      doctor?.fullName ??
      doctor?.user?.fullName ??
      patient?.fullName ??
      [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") ??
      "Doctor";

    const verified = doctor?.isVerified === true;

    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          Doctor Dashboard
        </p>

        <h1 className="mt-2 font-display text-4xl text-brand-900">
          Welcome, Dr. {fullName}
        </h1>

        <p className="mt-3 text-slate-500">
          Manage your professional profile and account.
        </p>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-brand-900">
                Doctor Profile
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {doctor?.email ?? patient?.email}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                verified
                  ? "bg-brand-100 text-brand-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {doctorLoading
                ? "Checking status..."
                : verified
                  ? "Verified"
                  : "Pending verification"}
            </span>
          </div>

          {doctorError && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {doctorError}
            </p>
          )}

          {doctorLoading ? (
            <p className="mt-5 text-sm text-slate-500">
              Loading professional information...
            </p>
          ) : doctor ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoItem
                label="Specialties"
                value={
                  doctor.specialties?.map(
                    (item) => item.name ?? item.specialtyName ?? item,
                  ).join(", ") ||
                  doctor.specialty?.name ||
                  "Not specified"
                }
              />

              <InfoItem
                label="Experience"
                value={`${doctor.experienceYears ?? 0} years`}
              />

              <InfoItem
                label="Consultation price"
                value={
                  doctor.consultationPrice == null
                    ? "Not specified"
                    : `${doctor.consultationPrice}`
                }
              />

              <InfoItem
                label="Average rating"
                value={doctor.averageRating ?? "No ratings yet"}
              />

              <div className="sm:col-span-2">
                <InfoItem
                  label="Professional bio"
                  value={doctor.bio || "No bio added yet."}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="rounded-xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              View profile
            </Link>

            <button
              type="button"
              onClick={async () => {
                await refreshProfile();
                window.location.reload();
              }}
              className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Refresh profile
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Log out
            </button>
          </div>

          {!verified && (
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Your professional profile has not yet been verified by an
              administrator. Some doctor features may remain unavailable
              until verification is complete.
            </p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
        Patient Dashboard
      </p>

      <h1 className="mt-2 font-display text-4xl text-brand-900">
        Welcome to MedFind
      </h1>

      <p className="mt-3 text-slate-500">
        Manage your appointments and personal information.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <DashboardCard
          title="My Appointments"
          description="View your upcoming and previous appointments."
          button="View appointments"
          link="/profile"
        />

        <DashboardCard
          title="Find a Doctor"
          description="Search for doctors by name or specialty."
          button="Find a doctor"
          link="/search"
        />

        <DashboardCard
          title="My Profile"
          description="View and manage your personal information."
          button="View profile"
          link="/profile"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-brand-900">
          Upcoming Appointments
        </h2>

        <div className="mt-5 rounded-xl bg-sand p-5">
          <p className="font-semibold text-slate-800">
            No upcoming appointments
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Find a doctor and book your first appointment.
          </p>

          <Link
            to="/search"
            className="mt-4 inline-flex rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Find a doctor
          </Link>
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-sand p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function DashboardCard({ title, description, button, link }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl text-brand-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      {link ? (
        <Link
          to={link}
          className="mt-5 inline-flex rounded-xl border border-brand-900 px-4 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-900 hover:text-white"
        >
          {button}
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 inline-flex rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-slate-500"
        >
          {button}
        </button>
      )}
    </div>
  );
}