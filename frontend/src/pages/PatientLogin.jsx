
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function PatientLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message;

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

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
    <main className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-5 py-16">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9"
        >
          <h2 className="text-[23px] font-bold text-slate-900 ml-25">
            Вход в аккаунт
          </h2>

          {successMessage && (
            <p
              role="status"
              className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {successMessage}
            </p>
          )}

          <div className="mt-6">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700 mt-10"
            >
              Электронная почта
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              required
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:bg-white focus:ring-4 focus:ring-cyan-700/10"
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Пароль
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Введите пароль"
              required
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:bg-white focus:ring-4 focus:ring-cyan-700/10"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-7 w-full rounded-xl bg-[#123b50] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#19556c] hover:shadow-lg disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Входим..." : "Войти в аккаунт"}
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">ИЛИ</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-600">
            Ещё нет аккаунта?{" "}
            <Link
              to="/register"
              className="font-semibold text-cyan-800 transition hover:text-cyan-600"
            >
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
