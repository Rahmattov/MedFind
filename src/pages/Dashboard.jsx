import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          User Dashboard
        </p>

        <h1 className="mt-2 font-display text-4xl text-brand-900">
          Welcome to MedFind
        </h1>

        <p className="mt-3 text-slate-500">
          Manage your appointments and account information.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <DashboardCard
          title="My Appointments"
          description="View your upcoming and previous appointments."
          button="View appointments"
        />

        <DashboardCard
          title="Find a Doctor"
          description="Search for doctors by name or specialty."
          button="Find a doctor"
          link="/search"
        />

        <DashboardCard
          title="My Profile"
          description="View and manage your personal information."
          button="View profile"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-brand-900">
          Upcoming Appointments
        </h2>

        <div className="mt-5 rounded-xl bg-sand p-5">
          <p className="font-semibold text-slate-800">
            No upcoming appointments
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Find a doctor and book your first appointment.
          </p>

          <Link
            to="/search"
            className="mt-4 inline-flex rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Find a doctor
          </Link>
        </div>
      </section>
    </div>
  );
}

function DashboardCard({ title, description, button, link }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl text-brand-900">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      {link ? (
        <Link
          to={link}
          className="mt-5 inline-flex rounded-xl border border-brand-900 px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white"
        >
          {button}
        </Link>
      ) : (
        <button
          type="button"
          className="mt-5 inline-flex rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-slate-500"
        >
          {button}
        </button>
      )}
    </div>
  );
}