import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const links = [
  { to: "/", label: "Главная" },
  { to: "/search", label: "Врачи" },
  { to: "/clinics", label: "Клиники" },
  { to: "/pharmacies", label: "Аптеки" },

];

export default function Header() {
  const { patient, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = String(
    patient?.role ?? patient?.roles?.[0] ?? patient?.userType ?? ""
  ).toLowerCase();

  const isDoctor = role.includes("doctor");
  const isPatient = Boolean(patient) && !isDoctor;

  const cabinetPath = isDoctor ? "/dashboard" : "/profile";

  const linkClass = ({ isActive }) =>
    [
      "relative whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-teal-50 text-teal-800"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="group mr-auto flex shrink-0 items-center gap-3"
          aria-label="MedFind — главная"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-teal-300 shadow-lg shadow-slate-900/10 transition duration-300 group-hover:rotate-[-5deg] group-hover:bg-teal-800">
            <PulseIcon />
          </span>

          <span className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Med<span className="text-teal-700">Find</span>
            </span>
            <span className="-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.19em] text-slate-400">
              Healthcare, simplified
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 rounded-2xl bg-slate-50/80 p-1.5 lg:flex">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={linkClass}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!loading &&
            (patient ? (
              <Link
                to={cabinetPath}
                className="hidden items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-teal-800 sm:inline-flex"
              >
                <UserIcon />
                <span>{isDoctor ? "Кабинет врача" : "Личный кабинет"}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-teal-800"
              >
                <span>Войти</span>
              </Link>
            ))}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 lg:hidden"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-xl shadow-slate-900/5 sm:px-6 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {label}
                <ArrowIcon />
              </NavLink>
            ))}

            <div className="my-2 border-t border-slate-100" />

            {!loading &&
              (patient ? (
                <Link
                  to={cabinetPath}
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  <UserIcon />
                  {isDoctor ? "Кабинет врача" : "Личный кабинет"}
                </Link>
              ) : (
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50"
                >
                  Создать аккаунт
                </Link>
              ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function PulseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M2 12h4l2.5-7L13 19l2.5-7H22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 21a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4 10h12m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}