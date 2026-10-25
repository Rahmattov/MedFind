import { Link } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  const name = doctor.name || "Врач";
  const rating = Number(doctor.rating);
  const price = Number(doctor.price);

  return (
    <article className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="h-2 bg-gradient-to-r from-brand-900 via-brand-600 to-brand-400" />

      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-900 ring-1 ring-brand-100">
            {getInitials(name)}
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              Специалист
            </span>

            <h3 className="mt-2 text-lg font-bold leading-snug text-slate-800">
              {name}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {doctor.specialty || "Специальность не указана"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sand p-3">
            <p className="text-xs text-slate-500">Опыт работы</p>
            <p className="mt-1 font-semibold text-slate-800">
              {doctor.experience != null
                ? `${doctor.experience} лет`
                : "Не указан"}
            </p>
          </div>

          <div className="rounded-2xl bg-sand p-3">
            <p className="text-xs text-slate-500">Рейтинг</p>
            <p className="mt-1 font-semibold text-slate-800">
              {Number.isFinite(rating) && rating > 0
                ? `★ ${rating.toFixed(1)}`
                : "Пока нет оценок"}
            </p>
          </div>
        </div>

        {doctor.clinic && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            <span className="mr-2">📍</span>
            {doctor.clinic}
          </p>
        )}

        <div className="mt-5 flex items-end justify-between border-t border-stone-100 pt-5">
          <div>
            <p className="text-xs text-slate-500">Стоимость приёма</p>
            <p className="mt-1 text-xl font-bold text-brand-900">
              {Number.isFinite(price) && price > 0
                ? `${price.toLocaleString("ru-RU")} ₸`
                : "Уточняется"}
            </p>
          </div>

          <span className="text-sm text-slate-400">за приём</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            to={`/doctor/${doctor.id}`}
            className="rounded-xl border border-brand-900 px-3 py-3 text-center text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            Подробнее
          </Link>

          <Link
            to={`/doctor/${doctor.id}#booking`}
            className="rounded-xl bg-brand-900 px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Записаться →
          </Link>
        </div>
      </div>
    </article>
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}