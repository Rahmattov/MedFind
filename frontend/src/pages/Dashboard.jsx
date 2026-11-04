
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

const TOKEN_KEY = "medfind_access_token";

export default function Dashboard() {
  const { patient, loading, refreshProfile, logout } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");

  const role = String(
    patient?.role ?? patient?.roles?.[0] ?? ""
  ).toLowerCase();

  const isDoctor = role === "doctor";
  const isClinicManager = role === "clinicmanager";

  useEffect(() => {
    if (!isDoctor) return;

    const controller = new AbortController();

    async function loadDoctor() {
      setDoctorLoading(true);
      setDoctorError("");

      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_URL}/doctors/me`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || data?.title || "Could not load your doctor profile."
          );
        }

        setDoctor(data);
      } catch (error) {
        if (error.name !== "AbortError") setDoctorError(error.message);
      } finally {
        if (!controller.signal.aborted) setDoctorLoading(false);
      }
    }

    loadDoctor();
    return () => controller.abort();
  }, [isDoctor]);

  useEffect(() => {
    if (loading || isDoctor || !patient) return;

    const controller = new AbortController();

    async function loadAppointments() {
      setAppointmentsLoading(true);
      setAppointmentsError("");

      try {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) throw new Error("Please log in to view your appointments.");

        const response = await fetch(`${API_URL}/appointments/my`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || data?.title || "Could not load your appointments."
          );
        }

        setAppointments(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setAppointmentsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) setAppointmentsLoading(false);
      }
    }

    loadAppointments();
    return () => controller.abort();
  }, [loading, isDoctor, patient]);

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-[#f6f8f5] px-5 py-16">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-xl bg-stone-200" />
          <div className="h-48 rounded-3xl bg-white" />
          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 rounded-3xl bg-white" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (isClinicManager) {
    return (
      <main className="min-h-screen bg-[#f6f8f5] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <HeaderTag>CLINIC WORKSPACE</HeaderTag>

          <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-[#173f35] p-8 text-white shadow-xl sm:p-12">
            <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-2 -top-14 h-52 w-52 rounded-full border border-white/10" />

            <div className="relative max-w-2xl">
              <p className="text-sm font-medium text-emerald-200">
                Welcome back
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Your clinic, <span className="text-emerald-200">in focus.</span>
              </h1>
              <p className="mt-4 max-w-xl leading-7 text-white/70">
                Manage incoming appointment requests and keep patient care
                organized in one place.
              </p>
              <Link
                to="/clinic-dashboard"
                className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-[#173f35] transition hover:bg-emerald-50"
              >
                Manage appointments <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </section>

          <div className="mt-6 flex justify-end">
            <LogoutButton logout={logout} />
          </div>
        </div>
      </main>
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
    const specialties =
      doctor?.specialties
        ?.map((item) => item.name ?? item.specialtyName ?? item)
        .join(", ") ||
      doctor?.specialty?.name ||
      "Not specified";

    return (
      <main className="min-h-screen bg-[#f6f8f5] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <HeaderTag>DOCTOR WORKSPACE</HeaderTag>

          <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-[#173f35] p-8 text-white shadow-xl sm:p-11">
            <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border border-white/10" />

            <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-emerald-200">Your professional space</p>
                <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  Welcome, Dr. {fullName}
                </h1>
                <p className="mt-4 max-w-xl leading-7 text-white/70">
                  Keep your professional information up to date and make it
                  easier for patients to discover you.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-white/60">
                  Account status
                </p>
                <p className="mt-3 flex items-center gap-2 font-semibold">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      doctorLoading
                        ? "bg-amber-300"
                        : verified
                          ? "bg-emerald-300"
                          : "bg-amber-300"
                    }`}
                  />
                  {doctorLoading
                    ? "Checking..."
                    : verified
                      ? "Verified professional"
                      : "Awaiting verification"}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]">
            <section className="rounded-3xl border border-[#e5eae3] bg-white p-6 shadow-sm sm:p-8">
              <SectionHeading
                eyebrow="YOUR INFORMATION"
                title="Professional profile"
                description="Your credentials and consultation details."
              />

              {doctorError && (
                <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                  {doctorError}
                </p>
              )}

              {doctorLoading ? (
                <div className="mt-6 space-y-3">
                  <div className="h-14 animate-pulse rounded-2xl bg-stone-100" />
                  <div className="h-14 animate-pulse rounded-2xl bg-stone-100" />
                  <div className="h-14 animate-pulse rounded-2xl bg-stone-100" />
                </div>
              ) : doctor ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoItem label="Specialties" value={specialties} />
                  <InfoItem
                    label="Experience"
                    value={`${doctor.experienceYears ?? 0} years`}
                  />
                  <InfoItem
                    label="Consultation price"
                    value={
                      doctor.consultationPrice == null
                        ? "Not specified"
                        : `${Number(doctor.consultationPrice).toLocaleString("en-US")} ₸`
                    }
                  />
                  <InfoItem
                    label="Average rating"
                    value={
                      Number(doctor.averageRating) > 0
                        ? `★ ${Number(doctor.averageRating).toFixed(1)}`
                        : "No ratings yet"
                    }
                  />
                  <div className="sm:col-span-2">
                    <InfoItem
                      label="Professional bio"
                      value={doctor.bio || "No bio added yet."}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <InfoItem
                      label="Email"
                      value={doctor.email ?? patient?.email ?? "Not available"}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-500">
                  Professional information is not available yet.
                </p>
              )}

              {!verified && (
                <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <span aria-hidden="true" className="text-xl">◷</span>
                  <div>
                    <p className="font-semibold text-amber-950">
                      Verification in progress
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Your professional profile is waiting for administrator
                      verification.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <div className="rounded-3xl border border-[#e5eae3] bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Quick actions
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-[#173f35]">
                  Keep your profile ready
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Make sure your experience, specialties, and consultation
                  information are accurate.
                </p>

                <Link
                  to="/profile"
                  className="mt-6 flex items-center justify-between rounded-2xl bg-[#173f35] px-5 py-4 font-semibold text-white transition hover:bg-[#245747]"
                >
                  View profile <span>↗</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    await refreshProfile();
                    window.location.reload();
                  }}
                  className="mt-3 w-full rounded-2xl border border-stone-200 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-stone-50"
                >
                  Refresh account
                </button>
              </div>

              <div className="rounded-3xl bg-[#eaf2eb] p-6">
                <span className="text-2xl" aria-hidden="true">✦</span>
                <h3 className="mt-3 font-semibold text-[#173f35]">
                  Quality care starts here
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#587064]">
                  A complete profile helps patients understand your
                  qualifications and services.
                </p>
              </div>

              <LogoutButton logout={logout} />
            </aside>
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    patient?.fullName ||
    [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") ||
    "Patient";

  const sortedAppointments = [...appointments].sort((a, b) =>
    `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)
  );

  const upcomingAppointments = sortedAppointments.filter((item) => {
    const status = Number(item.status);
    return status !== 2 && status !== 3 && status !== 4 && status !== 5;
  });

  const nextAppointment = upcomingAppointments.find(
    (item) => new Date(`${item.date}T${item.startTime || "00:00"}`) >= new Date()
  );

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">

        <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-[#173f35] p-8 text-white shadow-xl sm:p-11">
          <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-4 -top-12 h-56 w-56 rounded-full border border-white/10" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Hello, {fullName.split(" ")[0]}.
              </h1>
              <p className="mt-4 max-w-xl leading-7 text-white/70">
                Manage your consultations, find trusted specialists, and keep
                your healthcare journey in one place.
              </p>

              <Link
                to="/search"
                className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-[#173f35] transition hover:bg-emerald-50"
              >
                Find a doctor
              </Link>
            </div>

            <div className="relative min-w-44 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/65">Your appointments</p>
              <p className="mt-2 text-4xl font-semibold">
                {appointmentsLoading ? "—" : appointments.length}
              </p>
              <p className="mt-1 text-sm text-emerald-200">
                Total bookings
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickCard
            icon="▦"
            eyebrow="YOUR SCHEDULE"
            title="My appointments"
            description="Review your consultation schedule and booking statuses."
            link="#appointments"
            action="View schedule"
          />
          <QuickCard
            icon="⌕"
            eyebrow="FIND CARE"
            title="Discover doctors"
            description="Explore specialists and find the right care for you."
            link="/search"
            action="Explore doctors"
          />
          <QuickCard
            icon="◉"
            eyebrow="YOUR DETAILS"
            title="My profile"
            description="Review your personal information and account details."
            link="/profile"
            action="Open profile"
          />
        </div>

        {nextAppointment && (
          <section className="mt-6 flex flex-col gap-5 rounded-3xl border border-emerald-100 bg-[#eaf2eb] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl text-[#245747]">
                ◷
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-800">
                  Your next appointment
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#173f35]">
                  Dr. {nextAppointment.doctorName || "Doctor"}
                </h2>
                <p className="mt-1 text-sm text-[#587064]">
                  {formatDate(nextAppointment.date)} ·{" "}
                  {formatTime(nextAppointment.startTime)}
                </p>
                <p className="mt-1 text-sm text-[#587064]">
                  {nextAppointment.clinicName || "Clinic"}
                </p>
              </div>
            </div>
            <a
              href="#appointments"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#c9ddce] bg-white px-5 py-3 text-sm font-semibold text-[#173f35] transition hover:bg-emerald-50"
            >
              View appointment
            </a>
          </section>
        )}

        <section
          id="appointments"
          className="mt-7 scroll-mt-6 rounded-3xl border border-[#e5eae3] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading
              title="My appointments"
              description="All your booked consultations in one place."
            />
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245747]"
            >
              + Book a visit
            </Link>
          </div>

          {appointmentsLoading ? (
            <div className="mt-6 space-y-4">
              {[1, 2].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-2xl bg-stone-100" />
              ))}
            </div>
          ) : appointmentsError ? (
            <div role="alert" className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="font-semibold text-red-900">
                Could not load your appointments
              </p>
              <p className="mt-2 text-sm leading-6 text-red-700">
                {appointmentsError}
              </p>
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-[#fafbf9] px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf2eb] text-3xl text-[#245747]">
                +
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold text-[#173f35]">
                Your health journey starts here
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You don't have any appointments yet. Find a specialist and
                schedule your first consultation.
              </p>
              <Link
                to="/search"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173f35] px-6 py-3.5 font-semibold text-white transition hover:bg-[#245747]"
              >
                Find a specialist
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {sortedAppointments.map((appointment) => {
                const status = getAppointmentStatus(appointment.status);

                return (
                  <article
                    key={appointment.id}
                    className="group rounded-2xl border border-[#e8ece6] p-5 transition hover:border-[#c8d9ca] hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eaf2eb] text-[#173f35]">
                        <span className="text-xs font-bold uppercase">
                          {getMonth(appointment.date)}
                        </span>
                        <span className="text-2xl font-semibold leading-7">
                          {getDay(appointment.date)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[#173f35]">
                            Dr. {appointment.doctorName || "Doctor"}
                          </h3>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-medium text-slate-700">
                          {formatDate(appointment.date)}
                          <span className="mx-2 text-stone-300">•</span>
                          {formatTime(appointment.startTime)} –{" "}
                          {formatTime(appointment.endTime)}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          <span className="mr-2" aria-hidden="true">⌖</span>
                          {appointment.clinicName || "Clinic"}
                        </p>

                        {appointment.clinicAddress && (
                          <p className="mt-1 text-sm text-slate-400">
                            {appointment.clinicAddress}
                          </p>
                        )}

                        {appointment.reason && (
                          <p className="mt-3 rounded-xl bg-[#fafbf9] p-3 text-sm leading-6 text-slate-600">
                            <span className="font-semibold text-slate-700">
                              Reason:{" "}
                            </span>
                            {appointment.reason}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 self-start text-sm font-medium text-slate-400">
                        #{String(appointment.id).slice(-6)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-7 flex justify-end">
          <LogoutButton logout={logout} />
        </div>
      </div>
    </main>
  );
}

function HeaderTag({ children }) {
  return (
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
      <span className="h-2 w-2 rounded-full bg-emerald-600" />
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#173f35] sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function QuickCard({ icon, eyebrow, title, description, link, action }) {
  return (
    <article className="group flex flex-col rounded-3xl border border-[#e5eae3] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#c8d9ca] hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2eb] text-2xl text-[#245747]">
          {icon}
        </div>
        <span className="text-[10px] font-bold tracking-[0.14em] text-slate-400">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-5 font-display text-xl font-semibold text-[#173f35]">
        {title}
      </h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
      <Link
        to={link}
        className="mt-6 inline-flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-semibold text-[#245747]"
      >
        {action}
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </article>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#edf0eb] bg-[#fafbf9] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-[#263e34]">
        {value}
      </p>
    </div>
  );
}

function LogoutButton({ logout }) {
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      Log out
    </button>
  );
}

function getAppointmentStatus(status) {
  const statuses = {
    0: {
      label: "Awaiting confirmation",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
    1: {
      label: "Confirmed",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    2: {
      label: "Completed",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    },
    3: {
      label: "Cancelled by patient",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    4: {
      label: "Cancelled by doctor",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    5: {
      label: "Did not attend",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    },
    Pending: {
      label: "Awaiting confirmation",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
    Confirmed: {
      label: "Confirmed",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    Completed: {
      label: "Completed",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    },
    CancelledByPatient: {
      label: "Cancelled by patient",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    CancelledByDoctor: {
      label: "Cancelled by doctor",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    NoShow: {
      label: "Did not attend",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    },
  };

  return statuses[status] ?? statuses[String(status)] ?? {
    label: String(status ?? "Unknown"),
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };
}

function formatDate(value) {
  if (!value) return "Date not specified";

  const [year, month, day] = String(value).split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "--:--";

  const [hours, minutes] = String(value).split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getMonth(value) {
  if (!value) return "--";
  const [, month] = String(value).split("T")[0].split("-");
  const date = new Date(2000, Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en-US", { month: "short" })
    .format(date)
    .toUpperCase();
}

function getDay(value) {
  if (!value) return "—";
  return String(value).split("T")[0].split("-")[2] || "—";
}
