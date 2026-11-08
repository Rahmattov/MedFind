
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import PatientAppointments from "../components/PatientAppointments";

export default function PatientProfile() {
  const { patient, logout, refreshProfile, authError } = useAuth();
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const fullName =
    patient?.fullName ||
    [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") ||
    patient?.name ||
    "Пациент";

  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "П";

  const fields = [
    {
      label: "Электронная почта",
      value: patient?.email,
      icon: "✉",
    },
    {
      label: "Номер телефона",
      value: patient?.phoneNumber || patient?.phone,
      icon: "☎",
    },
    {
      label: "Дата рождения",
      value: formatDate(patient?.dateOfBirth),
      icon: "▦",
    },
    {
      label: "Пол",
      value: formatGender(patient?.gender),
      icon: "◉",
    },
    {
      label: "Город",
      value: patient?.cityName || patient?.city?.name,
      icon: "⌖",
    },
    {
      label: "Адрес",
      value: patient?.address,
      icon: "⌖",
    },
  ];

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError("");

    try {
      await refreshProfile();
    } catch (error) {
      setRefreshError(error?.message || "Не удалось обновить данные.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[#173f35] sm:text-4xl">
              Мой профиль
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Выйти из аккаунта
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-[#173f35] p-7 text-white shadow-lg sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-4 -top-12 h-48 w-48 rounded-full border border-white/10" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/10 font-display text-3xl font-semibold text-emerald-100 shadow-inner">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="mt-2 break-words font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {fullName}
              </h2>
              <p className="mt-2 break-words text-sm text-white/65">
                {patient?.email || "Электронная почта не указана"}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200/20 bg-emerald-200/10 px-4 py-2 text-sm font-medium text-emerald-100 sm:self-center">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Личный кабинет
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-3xl border border-[#e5eae3] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Информация, связанная с вашим профилем.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce7dc] bg-[#f7faf6] px-4 py-3 text-sm font-semibold text-[#245747] transition hover:bg-[#eaf2eb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span aria-hidden="true">{refreshing ? "◌" : "↻"}</span>
                {refreshing ? "Обновляем..." : "Обновить"}
              </button>
            </div>

            {authError && (
              <div
                role="status"
                className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4"
              >
                <p className="font-semibold text-amber-950">
                  Не удалось связаться с сервером
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Показаны доступные сохранённые данные. Попробуйте обновить
                  профиль.
                </p>
              </div>
            )}

            {refreshError && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
              >
                {refreshError}
              </div>
            )}

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              {fields.map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border border-[#edf0eb] bg-[#fafbf9] p-4 transition hover:border-[#d6e4d6]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf2eb] text-lg text-[#245747]">
                      {icon}
                    </span>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {label}
                    </dt>
                  </div>

                  <dd className="mt-4 break-words text-sm font-semibold leading-6 text-[#263e34]">
                    {value || "Не указано"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="self-start rounded-3xl border border-[#e5eae3] bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2eb] text-2xl text-[#245747]">
              ◫
            </div>

            <h3 className="mt-4 font-display text-xl font-semibold text-[#173f35]">
              Панель управления
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Перейдите на страницу dashboard.
            </p>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-5 flex w-full items-center justify-between rounded-xl bg-[#173f35] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#245747]"
            >
              Открыть dashboard
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="self-start rounded-3xl border border-[#e5eae3] bg-white p-6 shadow-sm">
            <h3 className="mt-4 font-display text-xl font-semibold text-[#173f35]">
              Кабинет клиники
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Перейдите в панель управления клиникой.
            </p>
            <button
              type="button"
              onClick={() => navigate("/clinic-dashboard")}
              className="mt-5 flex w-full items-center justify-between rounded-xl bg-[#173f35] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#245747]"
            >
              Открыть кабинет клиники
            </button>
          </div>
        </div>
        <PatientAppointments patient={patient} />
      </div>
    </main>
  );
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatGender(value) {
  if (!value) return "";

  const normalized = String(value).toLowerCase();

  if (normalized === "male") return "Мужской";
  if (normalized === "female") return "Женский";

  return value;
}
