import { useEffect, useMemo, useState } from "react";
import DoctorCard from "../components/DoctorCard";
import { apiRequest } from "../api/client";
import { filterDoctors, normalizeDoctor } from "./doctorSearchUtils";

const specialtyIcons = {
  "Все": "✚",
  "Терапевт": "🩺",
  "Кардиолог": "❤️",
  "Дерматолог": "✨",
  "Невролог": "🧠",
  "Педиатр": "🧸",
};

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("Все");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDoctors() {
      try {
        setLoading(true);
        setError("");

        const items = [];
        let page = 1;
        let totalPages = 1;
        do {
          const data = await apiRequest(`/doctors?page=${page}&pageSize=50`, {
            signal: controller.signal,
          });
          if (!Array.isArray(data?.items) || !Number.isInteger(data.totalPages) || data.totalPages < 0) {
            throw new Error("Некорректный ответ сервера");
          }
          items.push(...data.items);
          totalPages = data.totalPages;
          page += 1;
        } while (page <= totalPages);

        if (!controller.signal.aborted) {
          setDoctors(items.map(normalizeDoctor));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            "Проверьте подключение к серверу и попробуйте ещё раз."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDoctors();

    return () => controller.abort();
  }, [retry]);

  const specialties = useMemo(
    () => [
      "Все",
      ...new Set(
        doctors.flatMap((doctor) =>
          doctor.specialty
            .split(",")
            .map((item) => item.trim())
            .filter(
              (item) =>
                item && item !== "Специальность не указана"
            )
        )
      ),
    ],
    [doctors]
  );

  const filteredDoctors = useMemo(
    () => filterDoctors(doctors, search, specialty),
    [doctors, search, specialty]
  );

  function resetFilters() {
    setSearch("");
    setSpecialty("Все");
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] pb-16">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

        {/* Hero - same style as Clinics */}
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
              Найдите своего
              <span className="block text-emerald-200">
                идеального врача
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
              Изучайте профили специалистов, сравнивайте опыт и
              стоимость консультации и выбирайте врача для себя
              и своей семьи.
            </p>
          </div>
        </div>

        {/* Search and count */}
        <div className="mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mt-2 text-sm text-slate-500">
              Выберите врача, чтобы узнать подробности и записаться.
            </p>
          </div>

          {!loading && !error && (
            <p className="text-sm text-slate-500">
              Найдено врачей:{" "}
              <span className="font-semibold text-[#245541]">
                {filteredDoctors.length}
              </span>
            </p>
          )}
        </div>

        {/* Search input */}
        <div className="mt-6">
          <label htmlFor="doctor-search" className="sr-only">
            Поиск врачей
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
              id="doctor-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Имя, специальность или клиника..."
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

        {/* Round specialty filters */}
        {!loading && !error && doctors.length > 0 && (
          <div className="mt-9">
            <h3 className="text-sm font-semibold text-[#183d32]">
              Специальности
            </h3>

            <div className="mt-5 flex gap-5 overflow-x-auto pb-4">
              {specialties.map((item) => {
                const selected = specialty === item;
                const icon = specialtyIcons[item] || "⚕";

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSpecialty(item)}
                    aria-pressed={selected}
                    className="group flex min-w-[76px] shrink-0 flex-col items-center gap-2"
                  >
                    <span
                      className={`flex h-[68px] w-[68px] items-center justify-center rounded-full border text-2xl transition duration-200 group-hover:-translate-y-1 ${
                        selected
                          ? "border-[#245541] bg-[#245541] text-white shadow-lg shadow-emerald-900/15"
                          : "border-[#dce7dd] bg-white text-[#245541] group-hover:border-[#9dbba4] group-hover:bg-[#edf4ee]"
                      }`}
                    >
                      {icon}
                    </span>

                    <span
                      className={`max-w-[90px] text-center text-xs font-semibold ${
                        selected
                          ? "text-[#245541]"
                          : "text-slate-500 group-hover:text-[#245541]"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div role="status" aria-label="Загружаем врачей" className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <span className="sr-only">Загружаем врачей...</span>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-3xl border border-slate-200/80 bg-white p-6"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-3 pt-2">
                    <div className="h-3 w-20 rounded bg-slate-200" />
                    <div className="h-5 w-4/5 rounded bg-slate-200" />
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-2xl bg-slate-100" />
                  <div className="h-16 rounded-2xl bg-slate-100" />
                </div>
                <div className="mt-6 h-10 rounded-xl bg-slate-100" />
                <div className="mt-5 h-11 rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-white p-6 sm:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-red-600">
                !
              </span>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Не удалось загрузить врачей
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                  className="mt-4 rounded-xl bg-[#245541] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173f35]"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredDoctors.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4ee] text-3xl text-[#245541]">
              ⚕
            </div>

            <h3 className="mt-5 text-xl font-semibold text-[#183d32]">
              {doctors.length === 0
                ? "Пока нет врачей"
                : "Врачи не найдены"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {doctors.length === 0
                ? "Когда специалисты появятся в системе, они будут отображаться здесь."
                : "Попробуйте изменить поисковый запрос или выбрать другую специальность."}
            </p>

            {(search || specialty !== "Все") && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl bg-[#245541] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173f35]"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        )}

        {/* Doctor cards */}
        {!loading && !error && filteredDoctors.length > 0 && (
          <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs leading-5 text-slate-400">
          MedFind · Найдите специалиста для заботы о здоровье
        </p>
      </section>
    </main>
  );
}
