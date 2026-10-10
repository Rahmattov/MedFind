import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSpecialtyLabel, listSpecialties, searchDoctors } from "../api/doctors";
import DoctorCard from "../components/DoctorCard";

export default function DoctorSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState(
    searchParams.get("specialtyId") || "",
  );
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    listSpecialties()
      .then((result) => {
        if (active) setSpecialties(result ?? []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(() => {
      searchDoctors(
        { q: search.trim(), specialtyId: specialty, page, pageSize: 12 },
        { signal: controller.signal },
      )
        .then((result) => {
          if (!active) return;
          setDoctors(result.items);
          setTotalCount(result.totalCount ?? 0);
          setTotalPages(result.totalPages ?? 1);
          setError("");
        })
        .catch((requestError) => {
          if (active && requestError.name !== "AbortError") {
            setError(requestError.message);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, specialty, page, reload]);

  function updateSpecialty(value) {
    setSpecialty(value);
    setPage(1);
    if (value) setSearchParams({ specialtyId: value }, { replace: true });
    else setSearchParams({}, { replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          MedFind
        </p>

        <h1 className="font-display text-4xl text-brand-900 md:text-5xl">
          Найдите своего врача
        </h1>

        <p className="mt-3 max-w-2xl text-slate-500">
          Ищите врачей по имени или специальности и выберите подходящего
          специалиста.
        </p>
      </div>

      <div className="mb-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div>
            <label
              htmlFor="doctor-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Поиск врача
            </label>

            <input
              id="doctor-search"
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Например: терапевт или Иван"
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-brand-900 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label
              htmlFor="specialty"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Специальность
            </label>

            <select
              id="specialty"
              value={specialty}
              onChange={(event) => updateSpecialty(event.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-900 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Все специальности</option>
              {specialties.map((item) => (
                <option key={item.id} value={item.id}>
                  {getSpecialtyLabel(item)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-brand-900">
          Врачи
        </h2>

        <p className="text-sm text-slate-500">
          Найдено: {totalCount}
        </p>
      </div>

      {loading ? (
        <p role="status" className="py-8 text-center text-sm text-slate-500">
          Загружаем врачей...
        </p>
      ) : error ? (
        <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReload((current) => current + 1)}
            className="mt-3 font-semibold underline"
          >
            Попробовать снова
          </button>
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <h3 className="text-xl font-semibold text-slate-800">
            Врачи не найдены
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Попробуйте изменить поисковый запрос или выбрать другую
            специальность.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              updateSpecialty("");
            }}
            className="mt-5 rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Сбросить поиск
          </button>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            Назад
          </button>
          <span className="text-sm text-slate-600">
            Страница {page} из {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            Далее
          </button>
        </div>
      )}
    </div>
  );
}
