import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doctors, specialties } from "../data/doctors";

export default function DoctorSearch() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("Все");

  const results = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSpecialty =
        specialty === "Все" || doc.specialty === specialty;
      const matchesQuery = doc.name.toLowerCase().includes(query.toLowerCase());
      return matchesSpecialty && matchesQuery;
    });
  }, [query, specialty]);

  return (
    <div className="mx-auto mt-10 max-w-6xl px-6">
      <h1 className="mb-8 font-display text-4xl text-brand-900">Поиск врача</h1>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
        <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="mb-5">
            <input
              type="text"
              placeholder="Имя врача"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-sand px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-900"
            />
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Специальность
          </p>
          <div className="space-y-2">
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                className={[
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                  specialty === s
                    ? "bg-brand-50 font-semibold text-brand-900"
                    : "text-slate-600 hover:bg-stone-100",
                ].join(" ")}
                onClick={() => setSpecialty(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </aside>

        <div>
          {results.length === 0 && (
            <p className="py-12 text-center text-slate-500">
              Врачи не найдены. Попробуйте изменить фильтр.
            </p>
          )}

          <div className="space-y-3">
            {results.map((doc) => (
              <Link
                key={doc.id}
                to={`/doctor/${doc.id}`}
                className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-600 hover:shadow-soft"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-900">
                  {initials(doc.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-800">
                    {doc.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {doc.specialty} · {doc.experience} лет опыта · {doc.clinic}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-accent">
                    ★ {doc.rating}
                  </span>
                  <span className="text-sm text-slate-600">
                    {doc.price.toLocaleString("ru-RU")} ₸
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}
