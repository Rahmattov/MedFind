
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doctors as mockDoctors } from "../data/doctors";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

const TOKEN_KEY = "medfind_access_token";

function normalizeDoctor(doctor) {
  return {
    id: doctor.id,
    name: doctor.fullName ?? doctor.name ?? "Врач",
    rating: doctor.averageRating ?? doctor.rating ?? 0,
    price: doctor.consultationPrice ?? doctor.price ?? 0,
    specialty:
      doctor.specialties?.map((item) => item.name).join(", ") ??
      doctor.specialty ??
      "",
    experience: doctor.experienceYears ?? doctor.experience ?? 0,
    clinics: doctor.clinics ?? [],
    clinic: doctor.clinics?.[0]?.name ?? doctor.clinic ?? "",
    about: doctor.bio ?? doctor.about ?? "",
    photoUrl: doctor.photoUrl ?? doctor.PhotoUrl ?? "",
  };
}

async function readResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        data?.title ||
        `Ошибка сервера: HTTP ${response.status}`
    );
  }

  return data;
}

export default function DoctorProfile() {
  const { id } = useParams();

  const mockDoctor = mockDoctors.find(
    (item) => String(item.id) === id
  );

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [clinicId, setClinicId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // Reviews
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewMessageType, setReviewMessageType] = useState("info");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDoctor() {
      setLoading(true);
      setLoadError("");
      setDoctor(null);
      setClinicId("");
      setDate("");
      setTime("");
      setSlots([]);
      setMessage("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/doctors/${encodeURIComponent(id)}`,
          { signal: controller.signal }
        );

        const data = await readResponse(response);

        if (!data?.id) {
          throw new Error("Сервер не вернул идентификатор врача.");
        }

        if (!controller.signal.aborted) {
          setDoctor(normalizeDoctor(data));
        }
      } catch (error) {
        if (error.name === "AbortError") return;

        if (mockDoctor) {
          setDoctor(normalizeDoctor(mockDoctor));
          setLoadError(
            "Не удалось загрузить данные из backend. Показан демонстрационный профиль; запись может быть недоступна."
          );
        } else {
          setLoadError(
            error.message || "Не удалось загрузить профиль врача."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDoctor();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (window.location.hash !== "#booking") return;

    requestAnimationFrame(() => {
      document.getElementById("booking")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [id, doctor]);

  useEffect(() => {
    if (!doctor?.id || !date || !clinicId) {
      setSlots([]);
      setTime("");
      setSlotsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadSlots() {
      setSlotsLoading(true);
      setSlots([]);
      setTime("");
      setMessage("");

      try {
        const params = new URLSearchParams({
          doctorId: doctor.id,
          date,
          clinicId,
        });

        const response = await fetch(
          `${API_BASE_URL}/appointments/slots?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await readResponse(response);

        if (!Array.isArray(data)) {
          throw new Error("Сервер вернул некорректный список времени.");
        }

        if (!controller.signal.aborted) {
          setSlots(data);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setMessage(
            error.message || "Не удалось загрузить свободное время."
          );
          setMessageType("error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSlotsLoading(false);
        }
      }
    }

    loadSlots();
    return () => controller.abort();
  }, [doctor?.id, date, clinicId]);

  useEffect(() => {
    const clinics = doctor?.clinics ?? [];

    setClinicId(clinics.length ? String(clinics[0].id) : "");
    setDate("");
    setTime("");
    setSlots([]);
  }, [doctor]);


async function loadReviews() {
  if (!doctor?.id) return;

  setReviewsLoading(true);
  setReviewsError("");

  try {
    const response = await fetch(
      `${API_BASE_URL}/doctors/${doctor.id}/reviews`
    );

    const data = await readResponse(response);

    setReviewsData(data);

    // Обновляем рейтинг в профиле врача
    setDoctor((current) =>
      current
        ? {
            ...current,
            rating: data.averageRating ?? current.rating,
          }
        : current
    );
  } catch (error) {
    setReviewsError(error.message || "Не удалось загрузить отзывы.");
  } finally {
    setReviewsLoading(false);
  }
}

async function toggleReviews() {
  const nextState = !reviewsOpen;
  setReviewsOpen(nextState);

  if (nextState && !reviewsData) {
    await loadReviews();
  }
}

async function handleReviewSubmit(event) {
  event.preventDefault();

  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    setReviewMessage("Войдите в аккаунт пациента, чтобы оставить отзыв.");
    setReviewMessageType("error");
    return;
  }

  if (!reviewComment.trim()) {
    setReviewMessage("Напишите комментарий.");
    setReviewMessageType("error");
    return;
  }

  setReviewSubmitting(true);
  setReviewMessage("");

  try {
    const response = await fetch(
      `${API_BASE_URL}/doctors/${doctor.id}/reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      }
    );

    await readResponse(response);

    setReviewComment("");
    setReviewRating(5);

    setReviewMessage("Спасибо! Ваш отзыв опубликован.");
    setReviewMessageType("success");

    await loadReviews();
  } catch (error) {
    setReviewMessage(
      error.message || "Не удалось отправить отзыв."
    );
    setReviewMessageType("error");
  } finally {
    setReviewSubmitting(false);
  }
}


  async function handleBooking(event) {
    event.preventDefault();
    setMessage("");

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setMessage("Войдите в аккаунт пациента, чтобы записаться на приём.");
      setMessageType("error");
      return;
    }

    if (!doctor?.id || !clinicId || !date || !time) {
      setMessage("Выберите клинику, дату и свободное время.");
      setMessageType("error");
      return;
    }

    if (!slots.some((slot) => slot.startTime === time)) {
      setMessage("Это время больше недоступно. Обновите расписание.");
      setMessageType("error");
      return;
    }

    setBookingLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          clinicId: Number(clinicId),
          date,
          startTime: time,
          reason: reason.trim() || null,
        }),
      });

      const data = await readResponse(response);

      setMessage(
        `Запись успешно создана!`
      );
      setMessageType("success");
      setTime("");
      setReason("");

      const params = new URLSearchParams({
        doctorId: doctor.id,
        date,
        clinicId,
      });

      const slotsResponse = await fetch(
        `${API_BASE_URL}/appointments/slots?${params.toString()}`
      );

      if (slotsResponse.ok) {
        const updatedSlots = await slotsResponse.json();
        if (Array.isArray(updatedSlots)) {
          setSlots(updatedSlots);
        }
      }
    } catch (error) {
      if (error.message?.includes("409")) {
        setMessage("Это время уже занято. Выберите другой свободный слот.");
      } else {
        setMessage(
          error.message || "Не удалось создать запись. Попробуйте ещё раз."
        );
      }

      setMessageType("error");
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7fa] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-6 w-32 rounded bg-slate-200" />
          <div className="h-64 rounded-[2rem] bg-slate-200 sm:h-72" />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-80 rounded-3xl bg-white" />
            <div className="h-[560px] rounded-3xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f4f7fa] px-5 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
            !
          </div>
          <h1 className="mt-6 text-3xl font-bold text-[#17364a]">
            Врач не найден
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {loadError || "Этот профиль недоступен."}
          </p>
          <Link
            to="/search"
            className="mt-7 inline-flex rounded-xl bg-[#173f53] px-6 py-3 font-semibold text-white transition hover:bg-[#117b83]"
          >
            Вернуться к врачам
          </Link>
        </div>
      </main>
    );
  }

  const name = doctor.name || "Врач";
  const price = Number(doctor.price);
  const rating = Number(doctor.rating);
  const experience = Number(doctor.experience);
  const clinics = doctor.clinics ?? [];
  const hasPrice = Number.isFinite(price) && price > 0;
  const hasRating = Number.isFinite(rating) && rating > 0;
  const hasExperience =
    doctor.experience != null &&
    Number.isFinite(experience) &&
    experience >= 0;

  return (
    <main className="min-h-screen bg-[#f4f7fa] pb-16 text-slate-800">
      {/* Profile hero */}
      <section className="relative overflow-hidden bg-[#102f43]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full border-[60px] border-cyan-300/[0.08]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-7 sm:px-8 sm:pb-28">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Все врачи
          </Link>
        </div>
      </section>

      <div className="relative mx-auto -mt-16 max-w-7xl px-5 sm:px-8">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.06] sm:p-9 lg:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] bg-[#e5f3f4] text-3xl font-bold text-[#173f53] ring-4 ring-white shadow-md sm:h-32 sm:w-32">
              {getInitials(name)}
              {doctor.photoUrl && (
                <img
                  src={doctor.photoUrl}
                  alt={name}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                Профиль специалиста
              </span>

              <h1 className="mt-4 break-words text-3xl font-bold tracking-tight text-[#17364a] sm:text-4xl lg:text-[2.7rem]">
                {name}
              </h1>

              <p className="mt-2 text-base leading-7 text-slate-500 sm:text-lg">
                {doctor.specialty || "Специальность не указана"}
              </p>

              {doctor.clinic && (
                <p className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                  <span className="text-teal-700" aria-hidden="true">⌖</span>
                  {doctor.clinic}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-64 md:grid-cols-1">
              <div className="rounded-2xl bg-[#f4f7fa] p-4 sm:p-5">
                <p className="text-xs font-medium text-slate-500">
                  Стоимость приёма
                </p>
                <p className="mt-2 text-xl font-bold tracking-tight text-[#173f53] sm:text-2xl">
                  {hasPrice
                    ? `${price.toLocaleString("ru-RU")} ₸`
                    : "Уточняется"}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50/70 p-4 sm:p-5">
                <p className="text-xs font-medium text-slate-500">
                  Рейтинг врача
                </p>
                <p className="mt-2 font-bold text-[#17364a]">
                  {hasRating ? (
                    <>
                      <span className="mr-1 text-amber-500">★</span>
                      {rating.toFixed(1)}
                      <span className="ml-1 text-xs font-medium text-slate-500">
                        из 5
                      </span>
                    </>
                  ) : (
                    "Пока без оценок"
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loadError && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {loadError}
          </div>
        )}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-8">
          {/* Doctor information */}
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mt-1 grid gap-3 sm:grid-cols-2">
                <InfoCard
                  icon="🩺"
                  label="Специальность"
                  value={doctor.specialty || "Не указана"}
                />
                <InfoCard
                  icon="💼"
                  label="Стаж работы"
                  value={
                    hasExperience
                      ? `${experience} ${getYearsLabel(experience)}`
                      : "Не указан"
                  }
                />
                <InfoCard
                  icon="🏥"
                  label="Клиника"
                  value={doctor.clinic || "Не указана"}
                />
                <InfoCard
                  icon="⭐"
                  label="Рейтинг"
                  value={hasRating ? `${rating.toFixed(1)} из 5` : "Нет оценок"}
                />
              </div>
            </section>


            {/* Patient Reviews */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="mt-2 text-2xl font-bold text-[#17364a]">
                      Отзывы пациентов
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-amber-50 px-5 py-3 text-center">
                    <p className="text-2xl font-bold text-[#17364a]">
                      ★ {Number(
                        reviewsData?.averageRating ?? doctor.rating ?? 0
                      ).toFixed(1)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {reviewsData?.reviewCount ?? 0} отзывов
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleReviews}
                  className="mt-6 flex w-full items-center justify-between rounded-xl border border-slate-200 px-5 py-4 text-left text-sm font-bold text-[#173f53] transition hover:border-teal-500 hover:bg-teal-50"
                >
                  {reviewsOpen ? "Скрыть отзывы" : "Показать отзывы"}
                  <span className="text-xl">
                    {reviewsOpen ? "−" : "+"}
                  </span>
                </button>

                {reviewsOpen && (
                  <div className="mt-6 space-y-5">
                    {reviewsLoading && (
                      <p className="text-sm text-slate-500">
                        Загружаем отзывы...
                      </p>
                    )}

                    {reviewsError && (
                      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        {reviewsError}
                        <button
                          type="button"
                          onClick={loadReviews}
                          className="ml-2 font-bold underline"
                        >
                          Повторить
                        </button>
                      </div>
                    )}

                    {!reviewsLoading && !reviewsError && reviewsData && (
                      <>
                        {reviewsData.reviews?.length > 0 ? (
                          <div className="space-y-4">
                            {reviewsData.reviews.map((review) => (
                              <article
                                key={review.id}
                                className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="font-bold text-[#17364a]">
                                    {review.patientName || "Пациент"}
                                  </p>

                                  <span className="text-lg text-amber-500">
                                    {"★".repeat(review.rating)}
                                    <span className="text-slate-300">
                                      {"★".repeat(5 - review.rating)}
                                    </span>
                                  </span>
                                </div>

                                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                                  {review.comment}
                                </p>

                                <p className="mt-3 text-xs text-slate-400">
                                  {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                                </p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-[#f8fafc] p-6 text-center">
                            <p className="text-2xl text-amber-400">★★★★★</p>
                            <p className="mt-3 font-semibold text-slate-700">
                              Пока нет отзывов
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Будьте первым, кто поделится впечатлением!
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t border-slate-100 pt-6">
                      <h3 className="text-lg font-bold text-[#17364a]">
                        Оставить отзыв
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Оцените врача от 1 до 5 звёзд.
                      </p>

                      <form onSubmit={handleReviewSubmit} className="mt-4">
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              aria-label={`Оценка ${star} из 5`}
                              className={`text-3xl transition hover:scale-110 ${
                                star <= reviewRating
                                  ? "text-amber-400"
                                  : "text-slate-300"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={reviewComment}
                          onChange={(event) =>
                            setReviewComment(event.target.value)
                          }
                          placeholder="Расскажите о своём опыте посещения врача..."
                          maxLength={2000}
                          rows={4}
                          className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                        />

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs text-slate-400">
                            {reviewComment.length}/2000
                          </span>

                          <button
                            type="submit"
                            disabled={
                              reviewSubmitting || !reviewComment.trim()
                            }
                            className="rounded-xl bg-[#117b83] px-6 py-3 font-bold text-white transition hover:bg-[#0d666e] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {reviewSubmitting
                              ? "Отправляем..."
                              : "Опубликовать отзыв"}
                          </button>
                        </div>

                        {reviewMessage && (
                          <p
                            role="status"
                            className={`mt-4 rounded-xl p-3 text-sm ${
                              reviewMessageType === "success"
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {reviewMessage}
                          </p>
                        )}
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Booking panel */}
          <aside
            id="booking"
            className="scroll-mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/[0.04] lg:sticky lg:top-6"
          >
            <div className="bg-[#173f53] px-6 py-6 text-white sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                  <span aria-hidden="true">▦</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                    Онлайн-запись
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Запись на приём
                  </h2>
                </div>
              </div>
            </div>

            <form onSubmit={handleBooking} className="space-y-5 p-6 sm:p-7">
              <div>
                <label
                  htmlFor="booking-clinic"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  1. Клиника
                </label>
                <select
                  id="booking-clinic"
                  value={clinicId}
                  onChange={(event) => {
                    setClinicId(event.target.value);
                    setTime("");
                    setMessage("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:bg-slate-50"
                  required
                  disabled={clinics.length === 0}
                >
                  <option value="">Выберите клинику</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                      {clinic.address ? ` — ${clinic.address}` : ""}
                    </option>
                  ))}
                </select>
                {clinics.length === 0 && (
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    Для этого врача не указаны клиники.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  2. Дата приёма
                </label>
                <input
                  id="booking-date"
                  type="date"
                  min={getToday()}
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setTime("");
                    setMessage("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="booking-time"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  3. Свободное время
                </label>
                <select
                  id="booking-time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:bg-slate-50"
                  required
                  disabled={
                    !date ||
                    !clinicId ||
                    slotsLoading ||
                    slots.length === 0
                  }
                >
                  <option value="">
                    {slotsLoading
                      ? "Загружаем расписание..."
                      : !date
                        ? "Сначала выберите дату"
                        : !clinicId
                          ? "Выберите клинику"
                          : slots.length === 0
                            ? "Нет свободного времени"
                            : "Выберите время"}
                  </option>
                  {slots.map((slot) => (
                    <option
                      key={`${slot.date}-${slot.startTime}`}
                      value={slot.startTime}
                    >
                      {slot.startTime} – {slot.endTime}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {slotsLoading
                    ? "Проверяем доступность времени..."
                    : "Показываем свободные слоты из расписания клиники."}
                </p>
              </div>

              <div>
                <label
                  htmlFor="booking-reason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Причина обращения
                  <span className="ml-1 font-normal text-slate-400">
                    (необязательно)
                  </span>
                </label>
                <textarea
                  id="booking-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Кратко опишите причину обращения"
                  maxLength={500}
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                />
              </div>

              {message && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`flex gap-3 rounded-xl p-4 text-sm leading-6 ${
                    messageType === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : messageType === "error"
                        ? "border border-red-200 bg-red-50 text-red-800"
                        : "border border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <span className="font-bold" aria-hidden="true">
                    {messageType === "success"
                      ? "✓"
                      : messageType === "error"
                        ? "!"
                        : "i"}
                  </span>
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  bookingLoading ||
                  slotsLoading ||
                  !time ||
                  !slots.some((slot) => slot.startTime === time)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#117b83] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d666e] focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bookingLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Отправляем заявку...
                  </>
                ) : (
                  <>
                    Записаться на приём
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({ eyebrow, title, icon }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5f5] text-xl font-bold text-[#117b83]">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#17364a] sm:text-2xl">
          {title}
        </h2>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-2xl border border-slate-100 bg-[#f7f9fb] p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 self-center">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-5 text-[#17364a]">
          {value}
        </p>
      </div>
    </div>
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

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
