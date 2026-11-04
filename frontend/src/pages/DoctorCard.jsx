import { Link } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  const name = doctor.fullName || doctor.name || "Врач";
  const rating = Number(doctor.averageRating ?? doctor.rating ?? 0);
  const price = Number(doctor.consultationPrice ?? doctor.price ?? 0);
  const experience = Number(doctor.experienceYears ?? doctor.experience ?? 0);
  const photoUrl = doctor.photoUrl || doctor.PhotoUrl;
  const clinic =
    doctor.clinics?.[0]?.name || doctor.clinic || "";

  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-[#e8eeeb] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#cbded7] hover:shadow-[0_18px_45px_rgba(18,45,67,0.09)]">
      <Link
        to={`/doctor/${doctor.id}`}
        className="relative block h-52 overflow-hidden bg-[#e9f4f0]"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-semibold text-[#087b78] shadow-sm">
              {getInitials(name)}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-bold text-[#176d62] shadow-sm">
          ★ {Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : "Новый"}
        </div>
      </Link>

      <div className="p-5">
        <h3 className="mt-2 line-clamp-2 min-h-12 font-display text-lg font-semibold leading-6 text-[#122d43]">
          {name}
        </h3>

        <div className="mt-4 space-y-3 text-sm text-[#718092]">
          <div className="flex items-center gap-2">
            <span className="text-[#087b78]">◷</span>
            <span>
              Стаж: {experience > 0 ? experience : "Не указан"}{" "}
              {experience > 0 ? getYearsLabel(experience) : ""}
            </span>
          </div>

          {clinic && (
            <div className="flex items-start gap-2">
              <span className="text-[#087b78]">⌖</span>
              <span className="line-clamp-2">{clinic}</span>
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-[#edf0ed] pt-4">
          <p className="text-xs text-[#718092]">Стоимость приёма</p>
          <p className="mt-1 text-xl font-semibold text-[#122d43]">
            {Number.isFinite(price) && price > 0
              ? `${price.toLocaleString("ru-RU")} ₸`
              : "Уточняется"}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to={`/doctor/${doctor.id}`}
            className="rounded-full border border-[#cddbdc] px-2 py-3 text-center text-xs font-semibold text-[#173c50] transition hover:bg-[#f0f7f4] sm:text-sm"
          >
            Подробнее
          </Link>

          <Link
            to={`/doctor/${doctor.id}#booking`}
            className="rounded-full bg-[#086e70] px-2 py-3 text-center text-xs font-semibold text-white transition hover:bg-[#075c5e] sm:text-sm"
          >
            Записаться
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

function getYearsLabel(value) {
  const number = Math.abs(Number(value) || 0);
  const lastTwo = number % 100;
  const last = number % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return "лет";
  if (last === 1) return "год";
  if (last >= 2 && last <= 4) return "года";
  return "лет";
}