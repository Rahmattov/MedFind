import { Link } from "react-router-dom";
import { doctors } from "../data/doctors";

export default function Home() {
  const featured = doctors.slice(0, 4);

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-6 pt-12 md:grid-cols-[1.1fr_0.9fr] md:items-center lg:pt-16">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Онлайн-запись к врачу
          </p>
          <h1 className="font-display text-4xl leading-tight text-brand-900 md:text-6xl">
            Найдите врача,
            <br />
            которому доверяете
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Более 200 проверенных специалистов в Алматы. Смотрите рейтинг, опыт
            и стоимость приёма перед записью.
          </p>
          <Link
            to="/search"
            className="mt-8 inline-flex rounded-xl bg-brand-900 px-6 py-3.5 text-base font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            Найти врача
          </Link>
        </div>

        <div className="flex justify-center" aria-hidden="true">
          <HeroPattern />
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-6">
        <h2 className="mb-6 font-display text-3xl text-brand-900">
          Специальности
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {["Кардиолог", "Терапевт", "Дерматолог", "Педиатр"].map((s) => (
            <Link
              key={s}
              to="/search"
              className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-base font-semibold text-slate-700 shadow-sm transition hover:border-brand-600 hover:text-brand-900"
            >
              {s}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl text-brand-900">
            Рекомендованные врачи
          </h2>
          <Link to="/search" className="text-sm font-semibold text-brand-900">
            Смотреть всех →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featured.map((doc) => (
            <Link
              key={doc.id}
              to={`/doctor/${doc.id}`}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-900">
                  {initials(doc.name)}
                </div>
                <span className="text-sm font-semibold text-accent">
                  ★ {doc.rating}
                </span>
              </div>
              <p className="text-base font-semibold text-slate-800">
                {doc.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">{doc.specialty}</p>
              <p className="mt-4 text-sm text-slate-500">
                {doc.price.toLocaleString("ru-RU")} ₸ / приём
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}

function HeroPattern() {
  return (
    <svg viewBox="0 0 320 320" className="h-[280px] w-full max-w-[360px]">
      <circle cx="160" cy="160" r="150" fill="#dfeceb" />
      <path
        d="M60 170h50l18-55 26 110 20-75 16 30h70"
        fill="none"
        stroke="#0f3d3e"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="170" r="6" fill="#c9a227" />
      <circle cx="240" cy="170" r="6" fill="#c9a227" />
    </svg>
  );
}
