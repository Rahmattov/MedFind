import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDoctor } from "../api/doctors";

export default function DoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDoctor(id)
      .then((result) => { if (active) { setDoctor(result); setLoadError(""); } })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (window.location.hash === "#booking") {
      document.getElementById("booking")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [loading]);

  if (loading) return <p role="status" className="mx-auto max-w-6xl px-6 py-16 text-slate-500">Загружаем профиль врача...</p>;

  if (!doctor) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="text-5xl">🩺</div>
        <h1 className="mt-5 text-3xl font-bold text-brand-900">
          Врач не найден
        </h1>
        <p className="mt-3 text-slate-500">
          {loadError || "Возможно, этот профиль больше недоступен."}
        </p>
        <Link
          to="/search"
          className="mt-6 inline-block rounded-xl bg-brand-900 px-6 py-3 font-semibold text-white"
        >
          Вернуться к врачам
        </Link>
      </main>
    );
  }

  const name = doctor.name || "Врач";
  const price = Number(doctor.price);
  const rating = Number(doctor.rating);

  function handleBooking(event) {
    event.preventDefault();
    setMessage("");

    if (!date || !time) {
      setMessage("Выберите дату и удобное время.");
      return;
    }

    setMessage(
      "Форма заполнена. Для подтверждения записи необходимо подключить API записи к backend."
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <Link
            to="/search"
            className="text-sm text-white/75 transition hover:text-white"
          >
            ← Все врачи
          </Link>
          <p className="mt-5 text-sm font-medium text-teal-200">
            MEDFIND · ПРОФИЛЬ СПЕЦИАЛИСТА
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-1 max-w-6xl px-6">
        <section className="rounded-b-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-brand-50 text-3xl font-bold text-brand-900 ring-1 ring-brand-100">
              {getInitials(name)}
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Профиль врача
              </span>

              <h1 className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
                {name}
              </h1>

              <p className="mt-2 text-lg text-slate-500">
                {doctor.specialty || "Специальность не указана"}
              </p>

              {doctor.clinic && (
                <p className="mt-3 text-sm text-slate-500">
                  📍 {doctor.clinic}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-stone-50 p-5 sm:min-w-48">
              <p className="text-sm text-slate-500">Стоимость приёма</p>
              <p className="mt-1 text-2xl font-bold text-brand-900">
                {Number.isFinite(price) && price > 0
                  ? `${price.toLocaleString("ru-RU")} ₸`
                  : "Уточняется"}
              </p>
              <p className="mt-2 text-sm text-amber-600">
                {Number.isFinite(rating) && rating > 0
                  ? `★ ${rating.toFixed(1)} — рейтинг`
                  : "Рейтинг ещё не сформирован"}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-brand-900">
                О враче
              </h2>

              <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
                {doctor.about ||
                  "Информация о враче пока не добавлена. Вы можете уточнить подробности при обращении в клинику."}
              </p>
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-brand-900">
                Информация о специалисте
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon="🩺"
                  label="Специальность"
                  value={doctor.specialty || "Не указана"}
                />
                <InfoCard
                  icon="💼"
                  label="Стаж работы"
                  value={
                    doctor.experience != null
                      ? `${doctor.experience} лет`
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
                  value={
                    Number.isFinite(rating) && rating > 0
                      ? rating.toFixed(1)
                      : "Нет оценок"
                  }
                />
              </div>
            </section>
          </div>

          <aside
            id="booking"
            className="scroll-mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-24"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              Запись на приём
            </p>

            <h2 className="mt-2 text-2xl font-bold text-brand-900">
              Выберите удобное время
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Заполните форму, чтобы подготовить заявку на посещение врача.
            </p>

            <form onSubmit={handleBooking} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="booking-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Дата приёма
                </label>
                <input
                  id="booking-date"
                  type="date"
                  min={getToday()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="booking-time"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Время
                </label>
                <select
                  id="booking-time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  required
                >
                  <option value="">Выберите время</option>
                  {["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"].map(
                    (slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    )
                  )}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  Время пока демонстрационное — доступность расписания ещё не подключена.
                </p>
              </div>

              <div>
                <label
                  htmlFor="booking-reason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Причина обращения
                </label>
                <textarea
                  id="booking-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Кратко опишите, что вас беспокоит (необязательно)"
                  rows={3}
                  className="w-full resize-y rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {message && (
                <p
                  role="status"
                  className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-800"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-brand-900 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Подготовить заявку →
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                Отправка и подтверждение записи появятся после подключения API.
              </p>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-stone-50 p-4">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-words font-semibold text-slate-800">{value}</p>
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

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
