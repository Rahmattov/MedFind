import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDoctor } from "../api/doctors";

export default function DoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDoctor(id)
      .then((result) => {
        if (active) {
          setDoctor(result);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <p role="status" className="mx-auto max-w-6xl px-6 py-16 text-slate-500">
        Загружаем профиль врача...
      </p>
    );
  }

  if (error || !doctor) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p role="alert" className="text-red-700">
          {error || "Врач не найден."}
        </p>
        <Link
          to="/search"
          className="mt-4 inline-block text-sm font-semibold text-brand-900 underline"
        >
          Вернуться к поиску
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-6xl px-6">
      <Link
        to="/search"
        className="inline-block text-sm text-slate-500 transition hover:text-brand-900"
      >
        ← Назад к поиску
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-900">
              {initials(doctor.name)}
            </div>
            <div>
              <h1 className="font-display text-4xl text-brand-900">
                {doctor.name}
              </h1>
              <p className="mt-1 text-slate-500">
                {doctor.specialty}
                {doctor.clinic ? ` · ${doctor.clinic}` : ""}
              </p>
            </div>
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-display text-2xl text-brand-900">
              О враче
            </h2>
            <p className="text-base leading-8 text-slate-600">{doctor.about}</p>
            {doctor.clinics.length > 0 && (
              <div className="mt-5 border-t border-stone-200 pt-5">
                <h3 className="font-semibold text-slate-800">Клиники</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {doctor.clinics.map((clinic) => (
                    <li key={clinic.id}>
                      {clinic.name}
                      {clinic.address ? ` — ${clinic.address}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <p className="font-display text-3xl text-brand-900">
            {doctor.price == null
              ? "Цена не указана"
              : `${doctor.price.toLocaleString("ru-RU")} ₸`}
          </p>
          <p className="mt-1 text-sm text-slate-500">стоимость приёма</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-b border-stone-200 py-4 text-sm text-slate-600">
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Опыт
              </dt>
              <dd className="mt-2 font-semibold text-slate-800">
                {doctor.experience} лет
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Рейтинг
              </dt>
              <dd className="mt-2 font-semibold text-slate-800">
                ★ {doctor.rating}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-300 px-4 py-3 text-base font-semibold text-slate-600"
          >
            Онлайн-запись скоро появится
          </button>
        </aside>
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
