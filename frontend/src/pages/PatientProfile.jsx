import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function PatientProfile() {
  const { patient, logout, refreshProfile, authError } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const fullName =
    [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") ||
    patient?.fullName ||
    patient?.name ||
    "Пациент";
  const fields = [
    ["Электронная почта", patient?.email],
    ["Телефон", patient?.phone || patient?.phoneNumber],
    [
      "Дата рождения",
      patient?.dateOfBirth
        ? new Date(patient.dateOfBirth).toLocaleDateString("ru-RU")
        : "",
    ],
    ["Пол", patient?.gender],
    ["Город", patient?.cityName],
  ];

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError("");
    try {
      await refreshProfile();
    } catch (error) {
      setRefreshError(error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-stone-200 pb-6">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Личный кабинет
          </p>
          <h1 className="font-display text-4xl text-brand-900">
            Профиль пациента
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:opacity-60"
          >
            {refreshing ? "Обновляем..." : "Обновить данные"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Выйти
          </button>
        </div>
      </div>

      <section className="mt-8 max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4 border-b border-stone-200 pb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 font-display text-xl text-brand-900">
            {fullName
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{fullName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Данные вашего аккаунта
            </p>
          </div>
        </div>
        {authError && (
          <p
            role="status"
            className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Не удалось связаться с сервером. Показаны сохранённые данные.
          </p>
        )}
        {refreshError && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {refreshError}
          </p>
        )}
        <dl className="mt-2 divide-y divide-stone-100">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 py-4 sm:grid-cols-[200px_1fr] sm:gap-4"
            >
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="break-words text-sm font-medium text-slate-800">
                {value || "Не указано"}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
