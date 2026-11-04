
import { useCallback, useEffect, useMemo, useState } from "react";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

const TOKEN_KEY = "medfind_access_token";

function readRole(token) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)),
    );

    return String(
      decoded.role ??
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      decoded.roles?.[0] ??
      "",
    ).toLowerCase();
  } catch {
    return "";
  }
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new Error("Сессия истекла. Войди в аккаунт администратора заново.");
  }

  if (response.status === 403) {
    throw new Error("Доступ запрещён. Нужна роль Admin.");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Ошибка API: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

export default function AdminPanel() {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || "",
  );
  const [unassignedDoctors, setUnassignedDoctors] = useState([]);
  const [assignableClinics, setAssignableClinics] = useState([]);
  const [selectedClinicByDoctor, setSelectedClinicByDoctor] = useState({});
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [email, setEmail] = useState("admin@medfind.local");
  const [password, setPassword] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [verified, setVerified] = useState("false");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [overviewDoctors, setOverviewDoctors] = useState([]);
  const [overviewClinics, setOverviewClinics] = useState([]);
  const [pendingClinicCount, setPendingClinicCount] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const isAdmin = Boolean(token) && readRole(token) === "admin";

  const loadDoctors = useCallback(async () => {
    if (!token || readRole(token) !== "admin") return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (verified === "true" || verified === "false") {
        params.set("verified", verified);
      }

      if (search.trim()) {
        params.set("q", search.trim());
      }

      const query = params.toString();
      const url = query
        ? `/admin/doctors?${query}`
        : "/admin/doctors";

      const result = await request(url, token);

      setDoctors(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);

      if (err.message.includes("Сессия истекла")) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }, [token, verified, search]);

  const loadClients = useCallback(async () => {
  if (!token || readRole(token) !== "admin") return;

  setClientsLoading(true);
  setError("");

  try {
    const params = new URLSearchParams();

    if (clientSearch.trim()) {
      params.set("q", clientSearch.trim());
    }

    const query = params.toString();
    const url = query
      ? `/admin/clients?${query}`
      : "/admin/clients";

    const result = await request(url, token);

      setClients(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || "Не удалось загрузить клиентов.");
    } finally {
      setClientsLoading(false);
    }
  }, [token, clientSearch]);


  const loadClinicRequests = useCallback(async () => {
  if (!token || readRole(token) !== "admin") return;

  setClinicLoading(true);
  setError("");

  try {
    const result = await request(
      "/admin/clinic-requests?status=Pending",
      token,
    );

    setClinics(Array.isArray(result) ? result : []);
  } catch (err) {
    setClinics([]);
    setError(err.message || "Не удалось загрузить заявки клиник.");
  } finally {
    setClinicLoading(false);
  }
}, [token]);


  const loadClinicAssignments = useCallback(async () => {
    if (!token || readRole(token) !== "admin") return;

    setAssignmentLoading(true);

    try {
      const [doctorsResult, clinicsResult] = await Promise.all([
        request("/admin/doctors-without-clinics", token),
        request("/admin/assignable-clinics", token),
      ]);

      setUnassignedDoctors(
        Array.isArray(doctorsResult) ? doctorsResult : [],
      );

      setAssignableClinics(
        Array.isArray(clinicsResult) ? clinicsResult : [],
      );
    } catch (err) {
      setError(err.message || "Failed to load doctor-clinic assignments.");
    } finally {
      setAssignmentLoading(false);
    }
  }, [token]);

  async function assignDoctorToClinic(doctor) {
    const clinicId = selectedClinicByDoctor[doctor.id];

    if (!clinicId) {
      setError("Сначала выбери клинику.");
      return;
    }

    setBusyId(`assign-${doctor.id}`);
    setError("");
    setNotice("");

    try {
      const result = await request(
        `/admin/doctors/${doctor.id}/clinics/${clinicId}`,
        token,
        { method: "PUT" },
      );

      setNotice(result?.message || "Врач назначен в клинику.");

      await loadClinicAssignments();
    } catch (err) {
      setError(err.message || "Не удалось назначить клинику.");
    } finally {
      setBusyId("");
    }
  }

  const loadOverview = useCallback(async () => {
    if (!token || readRole(token) !== "admin") return;

    setOverviewLoading(true);

    try {
      const [doctorsResult, clinicsResult, pendingResult] =
        await Promise.all([
          request("/admin/doctors", token),
          request("/admin/assignable-clinics", token),
          request("/admin/clinic-requests?status=Pending", token),
        ]);

      const doctorList = Array.isArray(doctorsResult)
        ? doctorsResult
        : doctorsResult?.items ?? doctorsResult?.doctors ?? [];

      setOverviewDoctors(doctorList);

      setOverviewClinics(
        Array.isArray(clinicsResult)
          ? clinicsResult
          : clinicsResult?.items ?? [],
      );

      setPendingClinicCount(
        Array.isArray(pendingResult) ? pendingResult.length : 0,
      );
    } catch (err) {
      setError(
        err.message || "Не удалось загрузить общую статистику.",
      );
    } finally {
      setOverviewLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      loadDoctors();
      loadClinicRequests();
      loadClinicAssignments();
      loadOverview();
    }
  }, [
    isAdmin,
    loadDoctors,
    loadClinicRequests,
    loadClinicAssignments,
  ]);

  useEffect(() => {
    if (isAdmin) {
      loadClients();
    }
  }, [isAdmin, loadClients]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.title || "Не удалось войти.",
        );
      }

      const newToken = result.accessToken ?? result.token;

      if (!newToken) {
        throw new Error("Backend не вернул access token.");
      }

      if (readRole(newToken) !== "admin") {
        throw new Error("У этой учётной записи нет роли Admin.");
      }

      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setPassword("");
      setNotice("Вход выполнен.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadClientDetails(clientId) {
  setClientDetailsLoading(true);
  setSelectedClient(null);

  try {
    const result = await request(
      `/admin/clients/${clientId}`,
      token,
    );

    setSelectedClient(result);
  } catch (err) {
    setError(err.message || "Не удалось загрузить профиль клиента.");
  } finally {
    setClientDetailsLoading(false);
  }
}

async function toggleClientStatus(client) {
  const newStatus = !client.isActive;

  setBusyId(`client-${client.id}`);
  setError("");
  setNotice("");

  try {
    await request(
      `/admin/clients/${client.id}/active`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({ isActive: newStatus }),
      },
    );

    setNotice(
      `${client.fullName}: ${
        newStatus ? "аккаунт активирован." : "аккаунт заблокирован."
      }`,
    );

    await loadClients();

    if (selectedClient?.id === client.id) {
      await loadClientDetails(client.id);
    }
  } catch (err) {
    setError(err.message || "Не удалось изменить статус клиента.");
  } finally {
    setBusyId("");
  }
}

  async function changeVerification(doctor, isVerified) {
    setBusyId(doctor.id);
    setError("");
    setNotice("");

    try {
      await request(
        `/admin/doctors/${doctor.id}/verification`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({ isVerified }),
        },
      );

      setNotice(
        `${doctor.fullName}: ${
          isVerified ? "доктор подтверждён" : "подтверждение снято"
        }.`,
      );

      await loadDoctors();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }


async function approveClinic(clinic) {
  setBusyId(`clinic-${clinic.id}`);
  setError("");
  setNotice("");

  try {
    const result = await request(
      `/admin/clinic-requests/${clinic.id}/approve`,
      token,
      { method: "POST" },
    );

    setNotice(result?.message || `Клиника «${clinic.name}» одобрена.`);

    await Promise.all([
      loadClinicRequests(),
      loadClinicAssignments(),
    ]);
  } catch (err) {
    setError(err.message || "Не удалось одобрить клинику.");
  } finally {
    setBusyId("");
  }
}

async function rejectClinic(clinic) {
  const reason = window.prompt(
    `Укажи причину отклонения заявки «${clinic.name}»:`,
  );

  if (reason === null) return;

  if (!reason.trim()) {
    setError("Укажи причину отклонения.");
    return;
  }

  setBusyId(`clinic-${clinic.id}`);
  setError("");
  setNotice("");

  try {
    const result = await request(
      `/admin/clinic-requests/${clinic.id}/reject`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      },
    );

    setNotice(
      result?.message || `Заявка клиники «${clinic.name}» отклонена.`,
    );

    await loadClinicRequests();
  } catch (err) {
    setError(err.message || "Не удалось отклонить заявку.");
  } finally {
    setBusyId("");
  }
}


  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setDoctors([]);
    setPassword("");
    setError("");
    setNotice("");
  }

  const stats = useMemo(() => ({
    total: doctors.length,
    pending: doctors.filter((doctor) => !doctor.isVerified).length,
    approved: doctors.filter((doctor) => doctor.isVerified).length,
  }), [doctors]);

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-12">
        <form
          onSubmit={handleLogin}
          className="w-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
            MedFind · Admin
          </p>
          <h1 className="mt-3 font-display text-3xl text-brand-900">
            Вход администратора
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Войди с учётной записью, у которой есть роль Admin.
          </p>

          <label className="mt-6 block text-sm font-medium">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className="mt-4 block text-sm font-medium">Пароль</label>
          <input
            className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            className="mt-6 w-full rounded-xl bg-brand-900 px-4 py-3 font-semibold text-white hover:bg-brand-700"
            type="submit"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    {/* Общая статистика */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-brand-900">
            Общая статистика платформы
          </h2>

          <button
            type="button"
            onClick={loadOverview}
            disabled={overviewLoading}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {overviewLoading ? "Загрузка..." : "Обновить статистику"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Всего врачей",
              value: overviewDoctors.length,
              description: "Все зарегистрированные врачи",
            },
            {
              title: "Подтверждённые врачи",
              value: overviewDoctors.filter((d) => d.isVerified).length,
              description: "Врачи с подтверждённым статусом",
            },
            {
              title: "Ожидают подтверждения",
              value: overviewDoctors.filter((d) => !d.isVerified).length,
              description: "Врачи, ожидающие одобрения",
            },
            {
              title: "Активные клиники",
              value: overviewClinics.length,
              description: "Клиники, доступные для назначения",
            },
            {
              title: "Заявки клиник",
              value: pendingClinicCount,
              description: "Ожидают решения администратора",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-stone-200 bg-white p-5"
            >
              <p className="text-sm font-medium text-slate-500">
                {item.title}
              </p>

              <p className="mt-3 text-3xl font-bold text-brand-900">
                {overviewLoading ? "—" : item.value}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

    {/* Ошибки и уведомления */}
    {error && (
      <p
        role="alert"
        className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
      >
        {error}
      </p>
    )}

    {notice && (
      <p
        role="status"
        className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
      >
        {notice}
      </p>
    )}

    {/* Ниже оставь секции заявок клиник,
        назначения врачей и подтверждения врачей */}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}


    {/* Clients Management */}
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">
            Clients Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Просмотр и управление зарегистрированными пациентами.
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 px-4 py-2">
          <span className="text-sm text-slate-500">Всего клиентов: </span>
          <span className="font-bold text-brand-900">
            {clients.length}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={clientSearch}
          onChange={(event) => setClientSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") loadClients();
          }}
          placeholder="Поиск по имени, email или телефону..."
          className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3"
        />

        <button
          type="button"
          onClick={loadClients}
          disabled={clientsLoading}
          className="rounded-xl bg-brand-900 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {clientsLoading ? "Загрузка..." : "Найти"}
        </button>
      </div>

      {clientDetailsLoading && (
        <p className="mt-4 text-sm text-slate-500">
          Загружаем профиль клиента...
        </p>
      )}

      {selectedClient && (
        <div className="mt-5 rounded-xl border border-brand-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-brand-900">
              Информация о клиенте
            </h3>

            <button
              type="button"
              onClick={() => setSelectedClient(null)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              Закрыть
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p><strong>Имя:</strong> {selectedClient.fullName}</p>
            <p><strong>Email:</strong> {selectedClient.email || "—"}</p>
            <p><strong>Телефон:</strong> {selectedClient.phoneNumber || "—"}</p>
            <p><strong>Город:</strong> {selectedClient.cityName || "—"}</p>
            <p><strong>Дата рождения:</strong> {selectedClient.dateOfBirth || "—"}</p>
            <p><strong>Пол:</strong> {selectedClient.gender || "—"}</p>
            <p>
              <strong>Записей на приём:</strong>{" "}
              {selectedClient.appointmentsCount}
            </p>
            <p>
              <strong>Статус:</strong>{" "}
              {selectedClient.isActive ? "Активен" : "Заблокирован"}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-slate-500">
              <th className="px-3 py-4 font-medium">Клиент</th>
              <th className="px-3 py-4 font-medium">Телефон</th>
              <th className="px-3 py-4 font-medium">Город</th>
              <th className="px-3 py-4 font-medium">Записи</th>
              <th className="px-3 py-4 font-medium">Регистрация</th>
              <th className="px-3 py-4 font-medium">Статус</th>
              <th className="px-3 py-4 font-medium">Действия</th>
            </tr>
          </thead>

          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-stone-100">
                <td className="px-3 py-4">
                  <p className="font-semibold text-slate-800">
                    {client.fullName}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {client.email || "—"}
                  </p>
                </td>

                <td className="px-3 py-4">
                  {client.phoneNumber || "—"}
                </td>

                <td className="px-3 py-4">
                  {client.cityName || "—"}
                </td>

                <td className="px-3 py-4">
                  {client.appointmentsCount}
                </td>

                <td className="px-3 py-4">
                  {client.createdAt
                    ? new Date(client.createdAt).toLocaleDateString("ru-RU")
                    : "—"}
                </td>

                <td className="px-3 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      client.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {client.isActive ? "Активен" : "Заблокирован"}
                  </span>
                </td>

                <td className="px-3 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadClientDetails(client.id)}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                    >
                      Профиль
                    </button>

                    <button
                      type="button"
                      disabled={busyId === `client-${client.id}`}
                      onClick={() => toggleClientStatus(client)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
                        client.isActive
                          ? "bg-rose-700 hover:bg-rose-800"
                          : "bg-emerald-700 hover:bg-emerald-800"
                      }`}
                    >
                      {busyId === `client-${client.id}`
                        ? "Сохранение..."
                        : client.isActive
                          ? "Заблокировать"
                          : "Активировать"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!clientsLoading && clients.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Клиенты не найдены.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {clientsLoading && (
          <p className="py-6 text-center text-sm text-slate-500">
            Загружаем клиентов...
          </p>
        )}
      </div>
    </section>


      {/* Clinic applications */}
      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-brand-900">
              Заявки клиник
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Проверяй заявки и одобряй клиники для работы на платформе.
            </p>
          </div>

          <button
            type="button"
            onClick={loadClinicRequests}
            disabled={clinicLoading}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {clinicLoading ? "Загрузка..." : "Обновить"}
          </button>
        </div>

        {clinicLoading && (
          <p className="py-5 text-sm text-slate-500">
            Загружаем заявки клиник...
          </p>
        )}

        {!clinicLoading && clinics.length === 0 && (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Нет ожидающих заявок на клиники.
          </p>
        )}

        <div className="mt-4 space-y-4">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="rounded-xl border border-stone-200 p-4"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {clinic.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Город: {clinic.cityName || "Не указан"}
                  </p>

                  <p className="text-sm text-slate-600">
                    Адрес: {clinic.address || "Не указан"}
                  </p>

                  <p className="text-sm text-slate-600">
                    Телефон клиники: {clinic.clinicPhone || "Не указан"}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    Ответственный: {clinic.managerFullName || "Не указан"}
                  </p>

                  <p className="text-sm text-slate-600">
                    Email: {clinic.managerEmail || "Не указан"}
                  </p>

                  <p className="text-sm text-slate-600">
                    Телефон ответственного: {clinic.managerPhone || "Не указан"}
                  </p>

                  {clinic.description && (
                    <p className="mt-2 text-sm text-slate-500">
                      {clinic.description}
                    </p>
                  )}

                  <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {clinic.approvalStatus || "Pending"}
                  </span>
                </div>

                <div className="flex shrink-0 flex-wrap items-start gap-2">
                  <button
                    type="button"
                    disabled={busyId === `clinic-${clinic.id}`}
                    onClick={() => approveClinic(clinic)}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {busyId === `clinic-${clinic.id}`
                      ? "Обработка..."
                      : "Одобрить"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === `clinic-${clinic.id}`}
                    onClick={() => rejectClinic(clinic)}
                    className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-brand-900">
              Назначение врачей клиникам
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Выбери врача без клиники и назначь ему одобренную клинику.
            </p>
          </div>

          <button
            type="button"
            onClick={loadClinicAssignments}
            disabled={assignmentLoading}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {assignmentLoading ? "Загрузка..." : "Обновить"}
          </button>
        </div>

        {assignableClinics.length === 0 && !assignmentLoading && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Нет активных одобренных клиник. Сначала одобри заявку на клинику
            или создай клинику через админ-панель.
          </p>
        )}

        {assignmentLoading && (
          <p className="py-5 text-sm text-slate-500">
            Загружаем врачей и клиники...
          </p>
        )}

        {!assignmentLoading && unassignedDoctors.length === 0 && (
          <p className="py-5 text-sm text-slate-500">
            Все зарегистрированные врачи уже связаны с клиниками.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {unassignedDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="flex flex-col gap-3 rounded-xl border border-stone-200 p-4 md:flex-row md:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {doctor.fullName}
                </p>
                <p className="text-sm text-slate-500">
                  {doctor.email}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {doctor.isVerified ? "Подтверждён" : "Не подтверждён"}
                  {" · "}
                  {doctor.isActive ? "Активен" : "Неактивен"}
                </p>
              </div>

              <select
                value={selectedClinicByDoctor[doctor.id] || ""}
                onChange={(event) =>
                  setSelectedClinicByDoctor((previous) => ({
                    ...previous,
                    [doctor.id]: event.target.value,
                  }))
                }
                disabled={assignableClinics.length === 0}
                className="min-w-0 rounded-xl border border-stone-300 px-3 py-2 md:w-64"
              >
                <option value="">Выбрать клинику</option>
                {assignableClinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                    {clinic.cityName ? ` — ${clinic.cityName}` : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={
                  !selectedClinicByDoctor[doctor.id] ||
                  busyId === `assign-${doctor.id}`
                }
                onClick={() => assignDoctorToClinic(doctor)}
                className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyId === `assign-${doctor.id}`
                  ? "Сохраняем..."
                  : "Назначить"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row">
          <input
            className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="rounded-xl border border-stone-200 px-4 py-3"
            value={verified}
            onChange={(event) => setVerified(event.target.value)}
          >
            <option value="false">Не подтверждены</option>
            <option value="true">Подтверждены</option>
            <option value="all">Все доктора</option>
          </select>

          <button
            onClick={loadDoctors}
            className="rounded-xl bg-brand-900 px-5 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Обновить
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-slate-500">
                <th className="px-3 py-4 font-medium">Доктор</th>
                <th className="px-3 py-4 font-medium">Телефон</th>
                <th className="px-3 py-4 font-medium">Статус</th>
                <th className="px-3 py-4 font-medium">Регистрация</th>
                <th className="px-3 py-4 font-medium">Действие</th>
              </tr>
            </thead>

            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="border-b border-stone-100">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-slate-800">
                      {doctor.fullName}
                    </p>
                    <p className="mt-1 text-slate-500">{doctor.email}</p>
                  </td>

                  <td className="px-3 py-4">{doctor.phoneNumber || "—"}</td>

                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        doctor.isVerified
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {doctor.isVerified ? "Подтверждён" : "Ожидает"}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    {doctor.createdAt
                      ? new Date(doctor.createdAt).toLocaleDateString("ru-RU")
                      : "—"}
                  </td>

                  <td className="px-3 py-4">
                    <button
                      disabled={busyId === doctor.id}
                      onClick={() =>
                        changeVerification(doctor, !doctor.isVerified)
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
                        doctor.isVerified
                          ? "bg-rose-700 hover:bg-rose-800"
                          : "bg-brand-900 hover:bg-brand-700"
                      }`}
                    >
                      {busyId === doctor.id
                        ? "Сохранение..."
                        : doctor.isVerified
                          ? "Снять подтверждение"
                          : "Подтвердить"}
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && doctors.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-slate-500">
                    Докторов по выбранному фильтру нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {loading && (
            <p className="py-6 text-center text-sm text-slate-500">
              Загружаем докторов...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
