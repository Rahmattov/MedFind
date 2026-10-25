import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cancelAppointment, listMyAppointments } from "../api/appointments";
import { useAuth } from "../auth/AuthContext";

export default function PatientProfile() {
  const { patient, logout, refreshProfile, authError } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);
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

  useEffect(() => {
    let active = true;

    listMyAppointments()
      .then((result) => {
        if (active) setAppointments(result);
      })
      .catch((error) => {
        if (active) setRefreshError(error.message);
      })
      .finally(() => {
        if (active) setAppointmentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError("");
    try {
      const [, updatedAppointments] = await Promise.all([
        refreshProfile(),
        listMyAppointments(),
      ]);
      setAppointments(updatedAppointments);
    } catch (error) {
      setRefreshError(error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCancelAppointment(appointment) {
    if (!window.confirm(`Отменить запись к ${appointment.doctorName}?`)) return;

    setCancellingAppointmentId(appointment.id);
    setRefreshError("");
    try {
      const updatedAppointment = await cancelAppointment(appointment.id);
      setAppointments((current) =>
        current.map((item) =>
          item.id === updatedAppointment.id ? updatedAppointment : item,
        ),
      );
    } catch (error) {
      setRefreshError(error.message);
    } finally {
      setCancellingAppointmentId(null);
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

      <section className="mt-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">
            Ваше здоровье
          </p>
          <h2 className="mt-2 font-display text-3xl text-brand-900">
            Мои записи
          </h2>
        </div>

        {appointmentsLoading ? (
          <p role="status" className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-slate-500">
            Загружаем записи...
          </p>
        ) : appointments.length > 0 ? (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                cancelling={cancellingAppointmentId === appointment.id}
                onCancel={() => handleCancelAppointment(appointment)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="font-semibold text-brand-900">Пока нет записей</h3>
            <p className="mt-2 text-sm text-slate-500">
              Выберите врача и отправьте заявку на приём — она появится здесь.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function AppointmentCard({ appointment, cancelling, onCancel }) {
  const status = getAppointmentStatus(appointment.status);
  const canCancel = ["Pending", "Confirmed"].includes(appointment.status);

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {formatAppointmentDate(appointment.date)}
          </p>
          <p className="mt-1 text-lg font-semibold text-brand-900">
            {formatAppointmentTime(appointment.startTime)} –{" "}
            {formatAppointmentTime(appointment.endTime)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>
      <h3 className="mt-4 font-semibold text-slate-800">
        {appointment.doctorName}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{appointment.specialty}</p>
      <p className="mt-3 text-sm text-slate-600">{appointment.clinicName}</p>
      {appointment.clinicAddress && (
        <p className="mt-1 text-sm text-slate-500">{appointment.clinicAddress}</p>
      )}
      {appointment.reason && (
        <p className="mt-3 border-t border-stone-100 pt-3 text-sm text-slate-600">
          Причина обращения: {appointment.reason}
        </p>
      )}
      {canCancel && (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
          >
            {cancelling ? "Отменяем..." : "Отменить запись"}
          </button>
        </div>
      )}
    </article>
  );
}

function formatAppointmentDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatAppointmentTime(value) {
  return value.slice(0, 5);
}

function getAppointmentStatus(value) {
  const statuses = {
    Pending: {
      label: "Ожидает подтверждения",
      className: "bg-amber-50 text-amber-800",
    },
    Confirmed: {
      label: "Подтверждена",
      className: "bg-brand-50 text-brand-800",
    },
    Completed: {
      label: "Завершена",
      className: "bg-slate-100 text-slate-700",
    },
    CancelledByPatient: {
      label: "Отменена пациентом",
      className: "bg-red-50 text-red-700",
    },
    CancelledByDoctor: {
      label: "Отменена врачом",
      className: "bg-red-50 text-red-700",
    },
    NoShow: {
      label: "Неявка",
      className: "bg-slate-100 text-slate-700",
    },
  };

  return statuses[value] ?? {
    label: value,
    className: "bg-slate-100 text-slate-700",
  };
}
