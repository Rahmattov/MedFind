import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function Doctors() {
  const { token } = useOutletContext();

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || data?.title || "Request failed",
        );
      }

      return data;
    },
    [token],
  );

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (verifiedFilter !== "all") {
        params.set("verified", verifiedFilter);
      }

      if (search.trim()) {
        params.set("q", search.trim());
      }

      const query = params.toString();
      const data = await request(
        `/admin/doctors${query ? `?${query}` : ""}`,
      );

      setDoctors(
        Array.isArray(data) ? data : data?.items || [],
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request, verifiedFilter, search]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  function getId(doctor) {
    return doctor.id ?? doctor.doctorId;
  }

  async function toggleVerification(doctor) {
    const id = getId(doctor);
    const isVerified = !doctor.isVerified;

    setBusyId(id);
    setError("");
    setNotice("");

    try {
      await request(`/admin/doctors/${id}/verification`, {
        method: "PUT",
        body: JSON.stringify({ isVerified }),
      });

      setNotice(
        isVerified
          ? "Врач успешно подтверждён."
          : "Подтверждение врача отменено.",
      );

      await loadDoctors();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const verifiedCount = doctors.filter(
    (doctor) => doctor.isVerified,
  ).length;

  const pendingCount = doctors.length - verifiedCount;

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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              MedFind Medical Network
            </p>

            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Найдите своего
              <span className="block text-emerald-200">
                медицинского специалиста
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
              Изучайте профили врачей, проверяйте их специализацию
              и находите специалистов для заботы о вашем здоровье.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Всего найдено врачей</p>
            <p className="mt-2 text-3xl font-semibold text-[#183d32]">
              {loading ? "—" : doctors.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Подтверждённые</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">
              {loading ? "—" : verifiedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ожидают проверки</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">
              {loading ? "—" : pendingCount}
            </p>
          </div>
        </div>

        {/* Search heading */}
        <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#183d32]">
              Наши врачи
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Выберите специалиста, чтобы ознакомиться с его статусом.
            </p>
          </div>

          {!loading && !error && (
            <p className="text-sm text-slate-500">
              Найдено врачей:{" "}
              <span className="font-semibold text-[#245541]">
                {doctors.length}
              </span>
            </p>
          )}
        </div>

        {/* Search and filters */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[#54806d] focus-within:ring-4 focus-within:ring-emerald-900/5">
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
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadDoctors();
              }}
              placeholder="Имя врача или email..."
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

          <select
            value={verifiedFilter}
            onChange={(event) => setVerifiedFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-[#54806d] focus:ring-4 focus:ring-emerald-900/5"
          >
            <option value="all">Все врачи</option>
            <option value="true">Подтверждённые</option>
            <option value="false">Ожидают проверки</option>
          </select>

          <button
            type="button"
            onClick={loadDoctors}
            disabled={loading}
            className="rounded-2xl bg-[#245541] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#173f35] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Загрузка..." : "Найти врачей"}
          </button>
        </div>

        {/* Notifications */}
        {notice && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-emerald-700"
          >
            {notice}
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
                  onClick={loadDoctors}
                  className="mt-4 rounded-xl bg-[#245541] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173f35]"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200/80 bg-white p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-6 h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="mt-6 h-11 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && doctors.length === 0 && (
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              </svg>
            </div>

            <h3 className="mt-5 text-xl font-semibold text-[#183d32]">
              Врачи не найдены
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Попробуйте изменить поисковый запрос или выбрать другой фильтр.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setVerifiedFilter("all");
              }}
              className="mt-5 rounded-xl bg-[#245541] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173f35]"
            >
              Показать всех врачей
            </button>
          </div>
        )}

        {/* Doctor cards */}
        {!loading && !error && doctors.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => {
              const id = getId(doctor);

              return (
                <article
                  key={id}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-emerald-900/20 hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)]"
                >
                  {/* Doctor card header */}
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[#edf4ee]">
                    <div
                      aria-hidden="true"
                      className="absolute -right-10 -top-16 h-48 w-48 rounded-full border border-[#245541]/10"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute -left-12 -bottom-24 h-48 w-48 rounded-full border border-[#245541]/10"
                    />

                    {(doctor.photoUrl || doctor.PhotoUrl) ? (
                      <img
                        src={doctor.photoUrl || doctor.PhotoUrl}
                        alt={doctor.fullName || "Врач"}
                        className="relative h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md"
                        loading="lazy"
                      />
                    ) : (
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-[#245541] text-3xl font-semibold text-white shadow-md">
                        {doctor.fullName?.charAt(0)?.toUpperCase() || "D"}
                      </div>
                    )}

                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        doctor.isVerified
                          ? "bg-white text-emerald-800"
                          : "bg-white text-amber-700"
                      }`}
                    >
                      {doctor.isVerified ? "✓ Подтверждён" : "Ожидает проверки"}
                    </span>
                  </div>

                  {/* Doctor information */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="text-xl font-semibold tracking-tight text-[#183d32] transition group-hover:text-[#38785b]">
                      {doctor.fullName || "Имя не указано"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {doctor.specialtyName ||
                        doctor.specialization ||
                        doctor.specialty ||
                        "Специализация не указана"}
                    </p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ee] text-[#245541]">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="m3 7 9 6 9-6" />
                          </svg>
                        </span>

                        <div className="min-w-0 pt-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Email
                          </p>
                          <p className="mt-1 break-all text-sm text-slate-700">
                            {doctor.email || "Не указан"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ee] text-[#245541]">
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
                          <p className="mt-1 text-sm text-slate-700">
                            {doctor.phoneNumber || "Не указан"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ee] text-[#245541]">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M12 3v18M3 12h18" />
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        </span>

                        <div className="min-w-0 pt-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Опыт работы
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {doctor.experienceYears != null
                              ? `${doctor.experienceYears} лет`
                              : "Не указан"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Verification action */}
                    <div className="mt-auto border-t border-slate-100 pt-5">
                      <button
                        type="button"
                        disabled={busyId === id}
                        onClick={() => toggleVerification(doctor)}
                        className={`w-full rounded-xl px-5 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          doctor.isVerified
                            ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                            : "bg-[#245541] text-white hover:bg-[#173f35]"
                        }`}
                      >
                        {busyId === id
                          ? "Сохранение..."
                          : doctor.isVerified
                            ? "Снять подтверждение"
                            : "Подтвердить врача"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center text-xs leading-5 text-slate-400">
          MedFind · Медицинские специалисты
        </p>
      </section>
    </main>
  );
}