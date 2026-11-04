
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

const initialForm = {
  pharmacyName: "",
  cityId: "",
  address: "",
  pharmacyPhone: "",
  description: "",
  managerFullName: "",
  managerEmail: "",
  managerPhone: "",
  password: "",
};

export default function PharmacyRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`${API}/cities`)
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error("Не удалось загрузить список городов");
        }
        return data;
      })
      .then((data) =>
        setCities(Array.isArray(data) ? data : data?.items ?? [])
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoadingCities(false));
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        cityId: form.cityId ? Number(form.cityId) : null,
      };

      const response = await fetch(`${API}/pharmacies/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        const validationErrors = data?.errors
          ? Object.values(data.errors).flat().join(" ")
          : "";

        throw new Error(
          validationErrors ||
            data?.detail ||
            data?.message ||
            data?.title ||
            data?.error ||
            `Ошибка сервера: HTTP ${response.status}`
        );
      }

      setSuccess(
        data?.message ||
          "Заявка отправлена. После проверки администратор примет решение."
      );
      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Произошла ошибка при отправке заявки.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <Link
        to="/pharmacies"
        className="text-sm font-semibold text-brand-700 hover:underline"
      >
        ← Вернуться к аптекам
      </Link>

      <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-soft sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">
          Партнёрам MedFind
        </p>

        <h1 className="mt-3 font-display text-3xl font-semibold text-brand-900 sm:text-4xl">
          Добавить аптеку
        </h1>

        <p className="mt-3 leading-7 text-slate-600">
          Заполните информацию об аптеке и её будущем менеджере.
          Аптека появится в каталоге после одобрения заявки администратором.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <p className="font-semibold">Заявка отправлена</p>
            <p className="mt-1">{success}</p>
            <button
              type="button"
              onClick={() => navigate("/pharmacies")}
              className="mt-3 font-semibold underline"
            >
              Перейти к каталогу аптек
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-4 text-lg font-semibold text-brand-900">
              Информация об аптеке
            </legend>

            <label className={`${labelClass} sm:col-span-2`}>
              Название аптеки *
              <input
                className={inputClass}
                name="pharmacyName"
                value={form.pharmacyName}
                onChange={updateField}
                maxLength={200}
                required
              />
            </label>

            <label className={labelClass}>
              Город
              <select
                className={inputClass}
                name="cityId"
                value={form.cityId}
                onChange={updateField}
                disabled={loadingCities}
              >
                <option value="">
                  {loadingCities ? "Загрузка городов…" : "Выберите город"}
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Телефон аптеки
              <input
                className={inputClass}
                name="pharmacyPhone"
                type="tel"
                value={form.pharmacyPhone}
                onChange={updateField}
                maxLength={30}
              />
            </label>

            <label className={`${labelClass} sm:col-span-2`}>
              Адрес *
              <input
                className={inputClass}
                name="address"
                value={form.address}
                onChange={updateField}
                maxLength={300}
                required
              />
            </label>

            <label className={`${labelClass} sm:col-span-2`}>
              Описание
              <textarea
                className={inputClass}
                name="description"
                value={form.description}
                onChange={updateField}
                maxLength={2000}
                rows={4}
                placeholder="Информация об аптеке, товарах и услугах…"
              />
            </label>
          </fieldset>

          <fieldset className="grid gap-5 border-t border-stone-200 pt-8 sm:grid-cols-2">
            <legend className="mb-4 text-lg font-semibold text-brand-900">
              Данные менеджера
            </legend>

            <label className={`${labelClass} sm:col-span-2`}>
              ФИО менеджера *
              <input
                className={inputClass}
                name="managerFullName"
                value={form.managerFullName}
                onChange={updateField}
                maxLength={200}
                autoComplete="name"
                required
              />
            </label>

            <label className={labelClass}>
              Рабочая электронная почта *
              <input
                className={inputClass}
                name="managerEmail"
                type="email"
                value={form.managerEmail}
                onChange={updateField}
                maxLength={256}
                autoComplete="email"
                required
              />
            </label>

            <label className={labelClass}>
              Телефон менеджера *
              <input
                className={inputClass}
                name="managerPhone"
                type="tel"
                value={form.managerPhone}
                onChange={updateField}
                maxLength={30}
                autoComplete="tel"
                required
              />
            </label>

            <label className={`${labelClass} sm:col-span-2`}>
              Пароль для аккаунта менеджера *
              <input
                className={inputClass}
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                required
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Минимум 8 символов. До одобрения заявки вход в аккаунт
                может быть недоступен.
              </span>
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-900 px-6 py-4 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Отправляем заявку…" : "Отправить на проверку"}
          </button>
        </form>
      </div>
    </section>
  );
}
