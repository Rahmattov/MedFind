import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function PatientLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from || "/profile", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-[1fr_420px] md:items-center md:py-20">
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          Личный кабинет пациента
        </p>
        <h1 className="font-display text-4xl leading-tight text-brand-900 md:text-5xl">
          Рады видеть вас снова
        </h1>
        <p className="mt-5 max-w-lg leading-7 text-slate-600">
          Войдите, чтобы открыть свой профиль и продолжить пользоваться MedFind.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft sm:p-8"
      >
        <h2 className="font-display text-2xl text-brand-900">Вход</h2>
        {successMessage && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800"
          >
            {successMessage}
          </p>
        )}
        <label
          className="mt-6 block text-sm font-medium text-slate-700"
          htmlFor="email"
        >
          Электронная почта
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
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
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
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
          {submitting ? "Входим..." : "Войти"}
        </button>
        <p className="mt-5 text-center text-sm text-slate-600">
          Нет аккаунта?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-900 hover:underline"
          >
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  );
}
