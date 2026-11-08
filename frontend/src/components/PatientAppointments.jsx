import { useEffect, useState } from "react";
import { listMyAppointments } from "../api/appointments";
import ru from "../locales/ru.json";
import { groupAppointments } from "./appointmentGroups";

const statusStyles = {
  Pending: "border-amber-200 bg-amber-50 text-amber-800",
  Confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Completed: "border-teal-200 bg-teal-50 text-teal-800",
  CancelledByPatient: "border-stone-200 bg-stone-50 text-stone-700",
  CancelledByDoctor: "border-orange-200 bg-orange-50 text-orange-800",
  NoShow: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value, fallback) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return fallback;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(date);
}

function formatTime(value, fallback) {
  return /^\d{2}:\d{2}/.test(value ?? "") ? value.slice(0, 5) : fallback;
}

export default function PatientAppointments({ patient }) {
  const labels = ru.patientAppointments;
  const [state, setState] = useState({ loading: true, error: false, items: [] });
  const [attempt, setAttempt] = useState(0);
  const [group, setGroup] = useState("upcoming");
  const roles = patient?.roles?.length ? patient.roles : [patient?.role];
  const isPatient = roles.some((role) => String(role).toLowerCase() === "patient");
  const patientId = patient?.id;

  useEffect(() => {
    if (!isPatient) return;
    const controller = new AbortController();
    setState({ loading: true, error: false, items: [] });

    listMyAppointments({ signal: controller.signal })
      .then((items) => {
        if (!Array.isArray(items)) throw new Error("Invalid appointment response");
        if (!controller.signal.aborted) setState({ loading: false, error: false, items });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ loading: false, error: true, items: [] });
      });

    return () => controller.abort();
  }, [isPatient, patientId, attempt]);

  if (!isPatient) return null;

  const fallback = labels.notSpecified;
  const groups = groupAppointments(state.items);
  const visibleItems = groups[group];
  return (
    <section aria-labelledby="patient-appointments-title" className="mt-6 rounded-3xl border border-[#e5eae3] bg-white p-6 shadow-sm sm:p-8">
      <h2 id="patient-appointments-title" className="font-display text-2xl font-semibold text-[#173f35]">
        {labels.title}
      </h2>

      {state.loading ? (
        <p role="status" className="mt-5 text-sm text-slate-500">{labels.loading}</p>
      ) : state.error ? (
        <div role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p>{labels.error}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold transition hover:bg-red-50">
            {labels.retry}
          </button>
        </div>
      ) : (
        <>
        <div role="group" aria-label={labels.groupLabel} className="mt-5 flex flex-wrap gap-2 rounded-2xl bg-[#f6f8f5] p-1.5 sm:inline-flex">
          {(["upcoming", "history"]).map((name) => (
            <button key={name} type="button" aria-pressed={group === name} onClick={() => setGroup(name)} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition sm:flex-none ${group === name ? "bg-white text-[#173f35] shadow-sm" : "text-slate-500 hover:text-[#245747]"}`}>
              {labels[name]} <span className="rounded-full bg-[#eaf2eb] px-2 py-0.5 text-xs text-[#245747]">{groups[name].length}</span>
            </button>
          ))}
        </div>
        {visibleItems.length === 0 ? (
          <p className="mt-5 text-sm leading-6 text-slate-500">{group === "upcoming" ? labels.emptyUpcoming : labels.emptyHistory}</p>
        ) : <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleItems.map((appointment) => (
            <article key={appointment.id} className="min-w-0 rounded-2xl border border-[#edf0eb] bg-[#fafbf9] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-semibold text-[#173f35]">{appointment.doctorName || fallback}</h3>
                  <p className="mt-1 break-words text-sm text-slate-500">{appointment.specialty || fallback}</p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles[appointment.status] || "border-stone-200 bg-stone-50 text-stone-700"}`}>
                  {labels.status[appointment.status] || labels.status.unknown}
                </span>
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">{labels.clinic}</dt><dd className="mt-1 break-words font-semibold text-[#263e34]">{appointment.clinicName || fallback}</dd></div>
                <div><dt className="text-slate-500">{labels.date}</dt><dd className="mt-1 font-semibold text-[#263e34]">{formatDate(appointment.date, fallback)}</dd></div>
                <div><dt className="text-slate-500">{labels.time}</dt><dd className="mt-1 font-semibold text-[#263e34]">{formatTime(appointment.startTime, fallback)} – {formatTime(appointment.endTime, fallback)}</dd></div>
                {appointment.clinicAddress && <div><dt className="text-slate-500">{labels.address}</dt><dd className="mt-1 break-words text-[#263e34]">{appointment.clinicAddress}</dd></div>}
                {appointment.reason && <div className="sm:col-span-2"><dt className="text-slate-500">{labels.reason}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-[#263e34]">{appointment.reason}</dd></div>}
              </dl>
            </article>
          ))}
        </div>}
        </>
      )}
    </section>
  );
}
