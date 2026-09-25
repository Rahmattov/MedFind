import { NavLink, Link } from "react-router-dom";

const links = [
  { to: "/", label: "Главная" },
  { to: "/search", label: "Врачи" },
  { to: "/login", label: "Войти" },
  { to: "/register", label: "Регистрация" },
  { to: "/dashboard", label: "Личный кабинет" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">

        <Link
          to="/"
          className="mr-auto flex items-center gap-2 font-display text-xl font-semibold text-brand-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-900">
            <PulseIcon />
          </span>

          MedFind
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                [
                  "pb-1 text-sm transition-colors",
                  isActive
                    ? "border-b-2 border-brand-900 text-brand-900"
                    : "text-slate-500 hover:text-slate-700",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/search"
          className="inline-flex items-center rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Записаться на приём
        </Link>
      </div>
    </header>
  );
}

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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