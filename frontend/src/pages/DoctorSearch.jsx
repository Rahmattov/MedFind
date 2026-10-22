import { useState } from "react";
import { doctors } from "../data/doctors";
import DoctorCard from "../components/DoctorCard";

export default function DoctorSearch() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("Все");

  const specialties = [
    "Все",
    ...new Set(doctors.map((doctor) => doctor.specialty)),
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      doctor.name.toLowerCase().includes(searchText) ||
      doctor.specialty.toLowerCase().includes(searchText);

    const matchesSpecialty =
      specialty === "Все" || doctor.specialty === specialty;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          MedFind
        </p>

        <h1 className="font-display text-4xl text-brand-900 md:text-5xl">
          Найдите своего врача
        </h1>

        <p className="mt-3 max-w-2xl text-slate-500">
          Ищите врачей по имени или специальности и выберите подходящего
          специалиста.
        </p>
      </div>

      <div className="mb-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div>
            <label
              htmlFor="doctor-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Поиск врача
            </label>

            <input
              id="doctor-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Например: терапевт или Иван"
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-brand-900 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label
              htmlFor="specialty"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Специальность
            </label>

            <select
              id="specialty"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-900 focus:ring-2 focus:ring-brand-100"
            >
              {specialties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-brand-900">
          Врачи
        </h2>

        <p className="text-sm text-slate-500">
          Найдено: {filteredDoctors.length}
        </p>
      </div>

      {filteredDoctors.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <h3 className="text-xl font-semibold text-slate-800">
            Врачи не найдены
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Попробуйте изменить поисковый запрос или выбрать другую
            специальность.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSpecialty("Все");
            }}
            className="mt-5 rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Сбросить поиск
          </button>
        </div>
      )}
    </div>
  );
}
