import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function Clinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`${API}/clinics`)
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.title ||
              "Не удалось загрузить клиники"
          );
        }
        return data;
      })
      .then((data) => {
        if (active) {
          setClinics(Array.isArray(data) ? data : data?.items ?? []);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Ошибка загрузки клиник");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredClinics = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return clinics;

    return clinics.filter((clinic) =>
      [
        clinic.name,
        clinic.cityName,
        clinic.address,
        clinic.phone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [clinics, search]);

  return (
    <main className="min-h-screen bg-[#f7f8f5]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Page heading */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#173f35] px-6 py-10 text-white shadow-sm sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-12 h-52 w-52 rounded-full border border-white/10"
          />

          <div className="relative max-w-2xl">
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Найдите свою
              <span className="block text-emerald-200">
                идеальную клинику
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
              Изучайте медицинские центры, находите удобное расположение
              и выбирайте место для заботы о своём здоровье.
            </p>
          </div>
        </div>

        {/* Search and results count */}
        <div className="mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mt-2 text-sm text-slate-500">
              Выберите клинику, чтобы узнать больше.
            </p>
          </div>

          {!loading && !error && (
            <p className="text-sm text-slate-500">
              Найдено клиник:{" "}
              <span className="font-semibold text-[#245541]">
                {filteredClinics.length}
              </span>
            </p>
          )}
        </div>

        <div className="mt-6">
          <label htmlFor="clinic-search" className="sr-only">
            Поиск клиник
          </label>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[#54806d] focus-within:ring-4 focus-within:ring-emerald-900/5 sm:max-w-xl">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5 shrink-0 text-slate-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>

            <input
              id="clinic-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Название, город, адрес..."
              className="min-w-0 flex-1 bg-transparent py-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Очистить
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white"
              >
                <div className="h-52 animate-pulse bg-slate-200" />
                <div className="space-y-3 p-6">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-white p-6 sm:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl">
                !
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Не удалось загрузить клиники
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {error}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Проверьте, запущен ли backend: {API}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl bg-[#245541] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173f35]"
                >
                  Обновить страницу
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredClinics.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4ee] text-[#245541]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
              </svg>
            </div>

            <h3 className="mt-5 text-xl font-semibold text-[#183d32]">
              {search ? "Ничего не найдено" : "Пока нет клиник"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search
                ? "Попробуйте изменить поисковый запрос."
                : "Когда клиники появятся в системе, они будут отображаться здесь."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-5 rounded-xl bg-[#245541] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173f35]"
              >
                Показать все клиники
              </button>
            )}
          </div>
        )}

        {/* Clinic cards */}
        {!loading && !error && filteredClinics.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClinics.map((clinic) => (
              <article
                key={clinic.id}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-emerald-900/20 hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)]"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-[#edf4ee]">
                  <div className="flex h-full items-center justify-center text-5xl text-[#245541]">
                    🏥
                  </div>

                  {(clinic.photoUrl || clinic.PhotoUrl) && (
                    <img
                      src={clinic.photoUrl || clinic.PhotoUrl}
                      alt={clinic.name || "Медицинская клиника"}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />

                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#245541] shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    Медицинская клиника
                  </span>
                </div>

                {/* Information */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-xl font-semibold tracking-tight text-[#183d32] transition group-hover:text-[#38785b]">
                    {clinic.name || "Медицинская клиника"}
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ee] text-[#245541]">
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
                      </span>
                      <div className="min-w-0 pt-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Город
                        </p>
                        <p className="mt-1 break-words text-sm text-slate-700">
                          {clinic.cityName || "Город не указан"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ee] text-[#245541]">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M12 21s-7-4.5-7-11a7 7 0 0 1 14 0c0 6.5-7 11-7 11Z" />
                          <circle cx="12" cy="10" r="2" />
                        </svg>
                      </span>
                      <div className="min-w-0 pt-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Адрес
                        </p>
                        <p className="mt-1 break-words text-sm leading-5 text-slate-700">
                          {clinic.address || "Адрес не указан"}
                        </p>
                      </div>
                    </div>

                    {clinic.phone && (
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ee] text-[#245541]">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />
                          </svg>
                        </span>
                        <div className="min-w-0 pt-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Телефон
                          </p>
                          <a
                            href={`tel:${clinic.phone}`}
                            className="mt-1 block break-words text-sm text-slate-700 transition hover:text-emerald-800"
                          >
                            {clinic.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-6">
                    <Link
                      to={`/clinics/${clinic.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#245541] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#173f35] focus:outline-none focus:ring-4 focus:ring-emerald-900/15"
                    >
                      Подробнее о клинике
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs leading-5 text-slate-400">
          MedFind · Информация о клиниках для вашего удобства
        </p>
      </section>
    </main>
  );
}