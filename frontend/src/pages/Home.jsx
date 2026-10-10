import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSpecialtyLabel, listSpecialties, searchDoctors } from "../api/doctors";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      searchDoctors({ page: 1, pageSize: 4 }),
      listSpecialties(),
    ])
      .then(([doctorResult, specialtyResult]) => {
        if (!active) return;
        setFeatured(doctorResult.items);
        setSpecialties(specialtyResult ?? []);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reload]);

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
            Сравните опыт, рейтинг и стоимость приёма, чтобы выбрать подходящего
            специалиста.
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
          {specialties.slice(0, 4).map((specialty) => (
            <Link
              key={specialty.id}
              to={`/search?specialtyId=${specialty.id}`}
              className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-base font-semibold text-slate-700 shadow-sm transition hover:border-brand-600 hover:text-brand-900"
            >
              {getSpecialtyLabel(specialty)}
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

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setReload((current) => current + 1);
              }}
              className="mt-3 font-semibold underline"
            >
              Попробовать снова
            </button>
          </div>
        )}
        {loading && !error && (
          <p role="status" className="text-sm text-slate-500">
            Загружаем врачей...
          </p>
        )}
        {!loading && !error && featured.length === 0 && (
          <p className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-slate-500">
            Пока нет врачей, доступных для записи.
          </p>
        )}
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
                {doc.price == null
                  ? "Стоимость не указана"
                  : `${doc.price.toLocaleString("ru-RU")} ₸ / приём`}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function initials(name = "") {
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
