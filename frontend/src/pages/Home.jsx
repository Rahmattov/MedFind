import { Link } from "react-router-dom";
import { doctors } from "../data/doctors";

export default function Home() {
  const featured = doctors.slice(0, 4);

  const specialties = [
    { name: "Кардиолог", icon: "♡", description: "Сердце и сосуды" },
    { name: "Терапевт", icon: "+", description: "Общее здоровье" },
    { name: "Дерматолог", icon: "✳", description: "Кожа и её здоровье" },
    { name: "Педиатр", icon: "⌂", description: "Здоровье детей" },
  ];

  return (
    <div className="bg-stone-50 pb-16">
      {/* Hero */}
      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Забота о здоровье начинается здесь
            </span>

            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-brand-900 md:text-6xl">
              Найдите врача,
              <br />
              <span className="text-teal-700">которому доверяете</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
              Изучайте профили специалистов, сравнивайте опыт и стоимость
              приёма и выбирайте подходящего врача.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/search"
                className="rounded-xl bg-brand-900 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Найти врача →
              </Link>

              <a
                href="#featured-doctors"
                className="rounded-xl border border-stone-200 bg-white px-6 py-3.5 font-semibold text-brand-900 transition hover:bg-stone-50"
              >
                Популярные врачи
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span>✓ Удобный поиск</span>
              <span>✓ Информация о специалистах</span>
              <span>✓ Онлайн-запись</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-5 rounded-full bg-teal-100 blur-3xl" />
            <div className="relative rounded-[2rem] border border-stone-200 bg-gradient-to-br from-teal-50 to-white p-6 sm:p-9">
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-3xl text-teal-800">
                    ✚
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Ваше здоровье</p>
                    <h2 className="text-xl font-bold text-brand-900">
                      В надёжных руках
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    ["01", "Выберите специалиста"],
                    ["02", "Изучите профиль врача"],
                    ["03", "Подготовьте запись"],
                  ].map(([number, label]) => (
                    <div
                      key={number}
                      className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 text-sm font-bold text-white">
                        {number}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs leading-5 text-slate-400">
                  MedFind помогает находить информацию о врачах и клиниках.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="mx-auto mt-14 max-w-6xl px-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
            Поиск по направлению
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-brand-900">
            Выберите специальность
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {specialties.map((specialty) => (
            <Link
              key={specialty.name}
              to={`/search?specialty=${encodeURIComponent(specialty.name)}`}
              className="group rounded-2xl border border-stone-200 bg-white p-5 transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-2xl font-bold text-teal-800 transition group-hover:bg-brand-900 group-hover:text-white">
                {specialty.icon}
              </div>
              <h3 className="mt-4 font-bold text-slate-800">
                {specialty.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {specialty.description}
              </p>
              <p className="mt-4 text-sm font-semibold text-brand-900">
                Найти врача →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured doctors */}
      <section
        id="featured-doctors"
        className="mx-auto mt-16 max-w-6xl scroll-mt-8 px-6"
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              Наши специалисты
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-brand-900">
              Рекомендованные врачи
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Изучите профиль и выберите подходящего специалиста.
            </p>
          </div>

          <Link
            to="/search"
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-900"
          >
            Все врачи →
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((doctor) => (
              <DoctorPreview key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-brand-900">
              Врачи скоро появятся
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Перейдите в поиск, чтобы посмотреть доступных специалистов.
            </p>
            <Link
              to="/search"
              className="mt-5 inline-flex rounded-xl bg-brand-900 px-5 py-3 font-semibold text-white"
            >
              Перейти к поиску
            </Link>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="rounded-3xl bg-brand-900 p-7 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-200">
            Просто и удобно
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold">
            Как пользоваться MedFind
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Найдите врача",
                text: "Выберите нужную специальность или воспользуйтесь поиском.",
              },
              {
                number: "02",
                title: "Изучите профиль",
                text: "Посмотрите информацию о специалисте, стаже и стоимости.",
              },
              {
                number: "03",
                title: "Подготовьте запись",
                text: "Выберите подходящую дату и время в профиле врача.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-white/15 bg-white/5 p-5"
              >
                <span className="text-sm font-bold text-teal-200">
                  {step.number}
                </span>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/70">
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          <Link
            to="/search"
            className="mt-8 inline-flex rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-900 transition hover:bg-teal-50"
          >
            Найти своего врача →
          </Link>
        </div>
      </section>
    </div>
  );
}

function DoctorPreview({ doctor }) {
  const name = doctor.name || "Врач";
  const rating = Number(doctor.rating);
  const price = Number(doctor.price);

  return (
    <article className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="h-1.5 bg-gradient-to-r from-brand-900 via-teal-700 to-teal-400" />

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-xl font-bold text-brand-900 ring-1 ring-teal-100">
            {initials(name)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-bold leading-6 text-slate-800">
              {name}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {doctor.specialty || "Специальность не указана"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-stone-50 p-3">
            <p className="text-xs text-slate-500">Стаж</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {doctor.experience != null
                ? `${doctor.experience} лет`
                : "Не указан"}
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 p-3">
            <p className="text-xs text-slate-500">Рейтинг</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {Number.isFinite(rating) && rating > 0
                ? `★ ${rating.toFixed(1)}`
                : "Нет оценок"}
            </p>
          </div>
        </div>

        {doctor.clinic && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            📍 {doctor.clinic}
          </p>
        )}

        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="text-xs text-slate-500">Стоимость приёма</p>
          <p className="mt-1 text-xl font-bold text-brand-900">
            {Number.isFinite(price) && price > 0
              ? `${price.toLocaleString("ru-RU")} ₸`
              : "Уточняется"}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to={`/doctor/${doctor.id}`}
            className="rounded-xl border border-brand-900 px-2 py-3 text-center text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            Подробнее
          </Link>
          <Link
            to={`/doctor/${doctor.id}#booking`}
            className="rounded-xl bg-brand-900 px-2 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Записаться →
          </Link>
        </div>
      </div>
    </article>
  );
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}