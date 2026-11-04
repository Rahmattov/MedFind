
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function ClinicDetails() {
  const { id } = useParams();

  const { patient } = useAuth();

  const role = (
    patient?.role ?? patient?.roles?.[0] ?? ""
  ).toLowerCase();

  const isPatient = role === "patient";

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [reviews, setReviews] = useState({});
  const [reviewForms, setReviewForms] = useState({});
  const [reviewMessages, setReviewMessages] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState(null);

  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setClinic(null);

    fetch(`${API}/clinics/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Клиника не найдена или ещё не опубликована."
              : data?.message ||
                  data?.title ||
                  "Не удалось загрузить клинику."
          );
        }

        return data;
      })
      .then((data) => {
        if (active) setClinic(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Ошибка загрузки.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
  let active = true;

  async function loadDoctors() {
    setDoctorsLoading(true);
    setDoctorsError("");

    try {
      const params = new URLSearchParams({
        clinicId: id,
        page: "1",
        pageSize: "50",
      });

      const response = await fetch(`${API}/doctors?${params}`);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Не удалось загрузить врачей."
        );
      }

      if (active) {
        setDoctors(
          Array.isArray(data) ? data : data?.items ?? data?.Items ?? []
        );
      }
      } catch (err) {
      if (active) {
        setDoctorsError(err.message || "Ошибка загрузки врачей.");
      }
      } finally {
        if (active) setDoctorsLoading(false);
      }
    }

    if (id) loadDoctors();

    return () => {
      active = false;
    };
  }, [id]);

  const name = clinic?.name || clinic?.Name || "Медицинская клиника";
  const photo = clinic?.photoUrl || clinic?.PhotoUrl;
  const address = clinic?.address || clinic?.Address;
  const city = clinic?.cityName || clinic?.CityName;
  const phone = clinic?.phone || clinic?.Phone;
  const description = clinic?.description || clinic?.Description;
  async function toggleReviews(doctorId) {
  if (expandedDoctor === doctorId) {
    setExpandedDoctor(null);
    return;
  }

  setExpandedDoctor(doctorId);

  if (reviews[doctorId]) return;

  try {
    const response = await fetch(
      `${API}/doctors/${doctorId}/reviews`
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Не удалось загрузить отзывы.");
    }

    setReviews((current) => ({
      ...current,
      [doctorId]: data,
    }));
  } catch (err) {
    setReviewMessages((current) => ({
      ...current,
      [doctorId]: err.message,
    }));
  }
}

  async function submitReview(doctorId) {
    const token = localStorage.getItem("medfind_access_token");
    const form = reviewForms[doctorId] || {
      rating: 5,
      comment: "",
    };

    if (!token) {
      setReviewMessages((current) => ({
        ...current,
        [doctorId]: "Сначала войдите в аккаунт.",
      }));
      return;
    }

    if (!form.comment.trim()) {
      setReviewMessages((current) => ({
        ...current,
        [doctorId]: "Напишите комментарий.",
      }));
      return;
    }

    setReviewSubmitting(doctorId);

    try {
      const response = await fetch(
        `${API}/doctors/${doctorId}/reviews`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: form.rating,
            comment: form.comment.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Не удалось отправить отзыв."
        );
      }

      setReviewForms((current) => ({
        ...current,
        [doctorId]: { rating: 5, comment: "" },
      }));

      setReviewMessages((current) => ({
        ...current,
        [doctorId]: "Спасибо! Ваш отзыв опубликован.",
      }));

      const updated = await fetch(
        `${API}/doctors/${doctorId}/reviews`
      );

      if (updated.ok) {
        const updatedData = await updated.json();

        setReviews((current) => ({
          ...current,
          [doctorId]: updatedData,
        }));
      }

      // Refresh doctor ratings.
      const params = new URLSearchParams({
        clinicId: id,
        page: "1",
        pageSize: "50",
      });

      const doctorsResponse = await fetch(`${API}/doctors?${params}`);

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();

        setDoctors(
          Array.isArray(doctorsData)
            ? doctorsData
            : doctorsData?.items ?? doctorsData?.Items ?? []
        );
      }
    } catch (err) {
      setReviewMessages((current) => ({
        ...current,
        [doctorId]: err.message || "Ошибка отправки отзыва.",
      }));
    } finally {
      setReviewSubmitting(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <Link
          to="/clinics"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-cyan-700"
        >
          <span aria-hidden="true">←</span>
          Все клиники
        </Link>

        {loading && (
          <div className="mt-8 animate-pulse space-y-6">
            <div className="h-72 rounded-3xl bg-slate-200 sm:h-96" />
            <div className="h-8 w-2/3 rounded-lg bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-white p-6"
          >
            <p className="font-semibold text-red-700">
              Не удалось открыть клинику
            </p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <Link
              to="/clinics"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Вернуться к клиникам
            </Link>
          </div>
        )}

        {!loading && !error && clinic && (
          <>
            {/* Hero */}
            <section className="relative mt-7 overflow-hidden rounded-[2rem] bg-[#123b50]">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : null}

              <div className="absolute inset-0 bg-gradient-to-r from-[#092c40]/95 via-[#092c40]/70 to-[#092c40]/15" />

              <div className="relative flex min-h-[340px] items-end px-6 py-9 sm:min-h-[410px] sm:px-10 sm:py-12 lg:px-14">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-teal-300" />
                    MedFind Healthcare
                  </span>

                  <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                    {name}
                  </h1>

                  <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-200 sm:text-base">
                    <span aria-hidden="true">⌖</span>
                    <span>
                      {[city, address].filter(Boolean).join(", ") ||
                        "Адрес уточняется"}
                    </span>
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      to="/search"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-[#092c40] shadow-lg transition hover:bg-cyan-300"
                    >
                      Найти врача
                      <span aria-hidden="true">↗</span>
                    </Link>

                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                      >
                        Позвонить
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Main content */}
            <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-xl text-cyan-700">
                      ✳
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                        About the clinic
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        О клинике
                      </h2>
                    </div>
                  </div>

                  <p className="mt-6 whitespace-pre-line text-sm leading-8 text-slate-600 sm:text-base">
                    {description ||
                      "Подробная информация об этой клинике пока не добавлена."}
                  </p>
                </section>

                <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                    Contact information
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    Контактная информация
                  </h2>

                  <div className="mt-6 divide-y divide-slate-100">
                    <div className="flex gap-4 py-5 first:pt-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                        📍
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          Адрес
                        </p>
                        <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                          {address || "Адрес пока не указан"}
                        </p>
                        {city && (
                          <p className="mt-1 text-sm text-slate-500">{city}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 py-5 last:pb-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                        ☎
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          Телефон
                        </p>
                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="mt-1 inline-block break-words text-sm font-medium text-cyan-700 transition hover:text-cyan-900"
                          >
                            {phone}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-slate-500">
                            Телефон пока не указан
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <aside className="h-fit rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:sticky lg:top-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4f7f5] text-2xl">
                  🩺
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  Забота о вашем здоровье
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Подберите специалиста и изучите доступные варианты
                  консультации.
                </p>

                <div className="my-6 h-px bg-slate-100" />

                <div className="space-y-3 text-sm text-slate-600">
                  <p className="flex items-center gap-3">
                    <span className="text-teal-600">✓</span>
                    Поиск врачей
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="text-teal-600">✓</span>
                    Информация о специалистах
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="text-teal-600">✓</span>
                    Удобный поиск услуг
                  </p>
                </div>

                <Link
                  to="/search"
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123b50] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#19556c]"
                >
                  Подобрать врача
                  <span aria-hidden="true">→</span>
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                  MedFind — поиск медицинских услуг
                </p>
              </aside>
            </div>


            {/* Doctors of this clinic */}
            <section className="mt-10">
              <div className="mb-7">
                <p className="mt-2 text-sm text-slate-500">
                  Ознакомьтесь со специалистами, их опытом и отзывами пациентов.
                </p>
              </div>

              {doctorsLoading ? (
                <div className="rounded-2xl bg-white p-8 text-slate-500">
                  Загружаем врачей...
                </div>
              ) : doctorsError ? (
                <div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
                  {doctorsError}
                </div>
              ) : doctors.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8">
                  <h3 className="font-semibold text-slate-900">
                    Пока нет доступных врачей
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Врачи этой клиники появятся здесь после подтверждения их профилей.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {doctors.map((doctor) => {
                    const doctorId = doctor.id;

                    const specialties = (doctor.specialties || [])
                      .map((item) =>
                        typeof item === "string" ? item : item.name
                      )
                      .filter(Boolean);

                    return (
                      <article
                        key={doctorId}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            {doctor.photoUrl ? (
                              <img
                                src={doctor.photoUrl}
                                alt={doctor.fullName}
                                className="h-24 w-24 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-3xl font-bold text-cyan-700">
                                {(doctor.fullName || "D").charAt(0)}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <h3 className="text-xl font-bold text-slate-900">
                                {doctor.fullName}
                              </h3>
                              <p className="mt-1 text-sm text-cyan-700">
                                {specialties.join(", ") || "Medical Specialist"}
                              </p>
                              <p className="mt-2 text-sm text-slate-500">
                                {doctor.experienceYears ?? 0} лет опыта
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <div>
                              <p className="text-xs text-slate-400">
                                Стоимость консультации
                              </p>
                              <p className="mt-1 font-bold text-slate-900">
                                {doctor.consultationPrice != null
                                  ? `${Number(doctor.consultationPrice).toLocaleString()} ₸`
                                  : "Не указана"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-400">
                                Рейтинг
                              </p>
                              <p className="mt-1 font-bold text-amber-500">
                                ★ {Number(doctor.averageRating || 0).toFixed(1)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5">
                            <Link
                              to={`/doctor/${doctorId}`}
                              className="inline-block rounded-xl bg-[#123b50] px-5 py-3 text-sm font-semibold text-white hover:bg-[#19556c]"
                            >
                              Профиль врача
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

          </>
        )}
      </div>
    </main>
  );
}
