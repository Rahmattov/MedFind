
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

const TOKEN_KEY = "medfind_access_token";

function readRole(token) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      atob(normalized + "=".repeat((4 - normalized.length % 4) % 4))
    );

    return String(
      decoded.role ??
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      decoded.roles?.[0] ??
      ""
    ).toLowerCase();
  } catch {
    return "";
  }
}

const navigation = [
  { label: "Dashboard", path: "/admin", icon: "◫" },
  { label: "Patients", path: "/admin/patients", icon: "♙" },
  { label: "Doctors", path: "/admin/doctors", icon: "⚕" },
  { label: "Clinics", path: "/admin/clinics", icon: "▦" },
  { label: "Clinic Requests", path: "/admin/clinic-requests", icon: "▤" },
  { label: "Pharmacies", path: "/admin/pharmacies", icon: "💊" },
  { label: "Pharmacy Requests", path: "/admin/pharmacy-requests", icon: "▤" },
  { label: "Doctor Assignments", path: "/admin/doctor-assignments", icon: "⇄" },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || ""
  );
  const [email, setEmail] = useState("admin@medfind.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const isAdmin = Boolean(token) && readRole(token) === "admin";

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoginLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.title || "Не удалось войти."
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    navigate("/admin", { replace: true });
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-brand-700">
            MedFind Administration
          </p>

          <h1 className="mt-4 text-3xl font-bold text-brand-900">
            Admin Login
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Войди с учётной записью администратора.
          </p>

          <label className="mt-6 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3"
            required
          />

          <label className="mt-4 block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3"
            required
          />

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="mt-6 w-full rounded-xl bg-brand-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loginLoading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-brand-900 text-white">
        <div className="border-b border-white/10 px-6 py-6">
          <h1 className="text-xl font-bold">MedFind</h1>
          <p className="mt-1 text-xs text-slate-300">Admin Panel</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-brand-900"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => navigate("/")}
            className="mb-2 w-full rounded-xl px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/10"
          >
            ← Back to website
          </button>

          <button
            onClick={logout}
            className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold hover:bg-rose-700"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-8">
          <h2 className="font-semibold text-brand-900">
            Administration
          </h2>
          <span className="text-sm text-slate-500">Administrator</span>
        </header>

        <main className="p-6 lg:p-8">
          <Outlet context={{ token }} />
        </main>
      </div>
    </div>
  );
}
