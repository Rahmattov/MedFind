import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { USE_MOCK_AUTH, useAuth } from "../auth/AuthContext";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function PatientRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Введите корректный адрес электронной почты.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(form.password)) {
      setError(
        "Пароль должен содержать минимум 8 символов, заглавную и строчную буквы, а также цифру.",
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPassword, ...accountDetails } = form;
      await register(accountDetails);
      if (USE_MOCK_AUTH) {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Аккаунт создан в демонстрационном режиме. Теперь войдите.",
          },
        });
      } else {
        navigate("/profile", { replace: true });
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-10 md:grid-cols-[1fr_480px] md:items-center md:py-14">
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          Пациентам
        </p>
        <h1 className="font-display text-4xl leading-tight text-brand-900 md:text-5xl">
          Ваше здоровье начинается с удобной записи
        </h1>
        <p className="mt-5 max-w-lg leading-7 text-slate-600">
          Создайте аккаунт, чтобы сохранить данные пациента и управлять своим
          профилем.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft sm:p-8"
      >
        <h2 className="font-display text-2xl text-brand-900">
          Регистрация пациента
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="firstName"
            >
              Имя
            </label>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={updateField}
              className="mt-2 w-full rounded-lg border border-stone-300 bg-sand px-3.5 py-3 outline-none focus:border-brand-700"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="lastName"
            >
              Фамилия
            </label>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={updateField}
              className="mt-2 w-full rounded-lg border border-stone-300 bg-sand px-3.5 py-3 outline-none focus:border-brand-700"
            />
          </div>
        </div>
        <label
          className="mt-5 block text-sm font-medium text-slate-700"
          htmlFor="email"
        >
          Электронная почта
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={updateField}
          className="mt-2 w-full rounded-lg border border-stone-300 bg-sand px-3.5 py-3 outline-none focus:border-brand-700"
        />
        <label
          className="mt-5 block text-sm font-medium text-slate-700"
          htmlFor="phone"
        >
          Телефон
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={updateField}
          className="mt-2 w-full rounded-lg border border-stone-300 bg-sand px-3.5 py-3 outline-none focus:border-brand-700"
        />
        <label
          className="mt-5 block text-sm font-medium text-slate-700"
          htmlFor="password"
        >
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.password}
          onChange={updateField}
          className="mt-2 w-full rounded-lg border border-stone-300 bg-sand px-3.5 py-3 outline-none focus:border-brand-700"
        />
        <label
          className="mt-5 block text-sm font-medium text-slate-700"
          htmlFor="confirmPassword"
        >
          Подтвердите пароль
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.confirmPassword}
          onChange={updateField}
          className="mt-2 w-full rounded-lg border border-stone-300 bg-sand px-3.5 py-3 outline-none focus:border-brand-700"
        />
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-brand-900 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Создаём аккаунт..." : "Создать аккаунт"}
        </button>
        <p className="mt-5 text-center text-sm text-slate-600">
          Уже есть аккаунт?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-900 hover:underline"
          >
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
