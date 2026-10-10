import { Link } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-base font-bold text-brand-900">
          {getInitials(doctor.name)}
        </div>

        <span className="text-sm font-semibold text-accent">
          ★ {doctor.rating ?? "—"}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-800">
        {doctor.name}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {doctor.specialty}
      </p>

      <div className="mt-4 space-y-2 text-sm text-slate-500">
        <p>
          💰{" "}
          {doctor.price == null
            ? "Цена не указана"
            : `${doctor.price.toLocaleString("ru-RU")} с / приём`}
        </p>

        {doctor.experience && (
          <p>💼 {doctor.experience} лет опыта</p>
        )}

        {doctor.clinic && (
          <p>📍 {doctor.clinic}</p>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          to={`/doctor/${doctor.id}`}
          className="flex-1 rounded-xl border border-brand-900 px-4 py-2.5 text-center text-sm font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white"
        >
          Подробнее
        </Link>
        <span className="flex-1 py-2.5 text-center text-xs text-slate-500">
          Запись скоро
        </span>
      </div>
    </div>
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}
