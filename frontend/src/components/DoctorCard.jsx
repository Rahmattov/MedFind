
import { Link } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  const name = doctor.name || "Врач";
  const rating = Number(doctor.rating);
  const price = Number(doctor.price);
  const experience = Number(doctor.experience);
  const specialty = doctor.specialty || "Специальность не указана";
  const clinic = doctor.clinic || "Клиника не указана";

  const hasRating = Number.isFinite(rating) && rating > 0;
  const hasPrice = Number.isFinite(price) && price > 0;
  const hasExperience =
    doctor.experience !== null &&
    doctor.experience !== undefined &&
    Number.isFinite(experience) &&
    experience >= 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/[0.06]">
      <div className="h-1 bg-gradient-to-r from-[#173f53] via-teal-600 to-cyan-300" />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eaf4f5] text-2xl font-bold text-[#173f53] ring-1 ring-slate-100">
            {getInitials(name)}

            {doctor.photoUrl && (
              <img
                src={doctor.photoUrl}
                alt={name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-800">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Специалист
            </span>

            <h3 className="mt-2 break-words text-lg font-bold leading-snug text-[#17364a] transition group-hover:text-teal-800">
              {name}
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              {specialty}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#f5f8fa] p-3.5">
            <p className="text-xs font-medium text-slate-500">
              Опыт работы
            </p>
            <p className="mt-2 text-sm font-bold text-[#17364a]">
              {hasExperience
                ? `${experience} ${getYearsLabel(experience)}`
                : "Не указан"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#f5f8fa] p-3.5">
            <p className="text-xs font-medium text-slate-500">Рейтинг</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[#17364a]">
              {hasRating ? (
                <>
                  <span className="text-amber-500">★</span>
                  {rating.toFixed(1)}
                </>
              ) : (
                <span className="text-slate-500">Нет оценок</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Клиника
            </p>
            <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-slate-600">
              {clinic}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
            <div>
              <p className="text-xs text-slate-500">Стоимость приёма</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-[#173f53]">
                {hasPrice
                  ? `${price.toLocaleString("ru-RU")} ₸`
                  : "Уточняется"}
              </p>
            </div>
            <span className="pb-1 text-xs text-slate-400">за приём</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              to={`/doctor/${doctor.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-semibold text-[#173f53] transition hover:border-teal-300 hover:bg-teal-50"
            >
              Профиль
            </Link>

            <Link
              to={`/doctor/${doctor.id}#booking`}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-[#173f53] px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#117b83] focus:outline-none focus:ring-4 focus:ring-teal-100"
            >
              Записаться
              <span aria-hidden="true">→</span>
            </Link>
          </div>
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

function getYearsLabel(years) {
  const lastTwo = years % 100;
  const lastOne = years % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return "лет";
  if (lastOne === 1) return "год";
  if (lastOne >= 2 && lastOne <= 4) return "года";
  return "лет";
}
