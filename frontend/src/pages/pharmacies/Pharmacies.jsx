import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [cities, setCities] = useState([]);

  const [search, setSearch] = useState("");
  const [cityId, setCityId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Загружаем список городов
  useEffect(() => {
    async function loadCities() {
      try {
        const response = await fetch(`${API}/cities`);

        if (!response.ok) {
          throw new Error("Failed to load cities");
        }

        const data = await response.json();
        setCities(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        console.error("Cities loading error:", err);
      }
    }

    loadCities();
  }, []);

  // Загружаем аптеки при изменении поиска или города
  useEffect(() => {
    async function loadPharmacies() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.append("q", search.trim());
        }

        if (cityId) {
          params.append("cityId", cityId);
        }

        const response = await fetch(
          `${API}/pharmacies?${params.toString()}`
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.title ||
              "Failed to load pharmacies"
          );
        }

        setPharmacies(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        setPharmacies([]);
      } finally {
        setLoading(false);
      }
    }

    loadPharmacies();
  }, [search, cityId]);

  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* Page heading */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mt-2 text-4xl font-bold text-brand-900">
              Pharmacies
            </h1>

            <p className="mt-3 text-slate-500">
              Find pharmacies and explore available services.
            </p>
          </div>

          <Link
            to="/pharmacies/register"
            className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white transition hover:bg-teal-800"
          >
            Register your pharmacy
          </Link>
        </div>

        {/* Search and city filter */}
        <div className="mt-10 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search pharmacy
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter pharmacy name..."
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Filter by city
            </label>

            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">All cities</option>

              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pharmacy list */}
        <div className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Available pharmacies
            </h2>

            <span className="text-sm text-slate-500">
              {pharmacies.length} pharmacies
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
              Loading pharmacies...
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-6 text-red-700">
              {error}
            </div>
          ) : pharmacies.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-800">
                No pharmacies found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or selecting another city.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pharmacies.map((pharmacy) => (
                <Link
                    key={pharmacy.id}
                    to={`/pharmacies/${pharmacy.id}`}
                    className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                  {pharmacy.photoUrl ? (
                    <img
                      src={pharmacy.photoUrl}
                      alt={pharmacy.name}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-teal-50">
                      <span className="text-5xl">💊</span>
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-slate-900">
                      {pharmacy.name}
                    </h3>

                    <p className="mt-2 text-sm text-teal-700">
                      {pharmacy.cityName || "City not specified"}
                    </p>

                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-semibold">Address:</span>{" "}
                      {pharmacy.address || "Not specified"}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-semibold">Phone:</span>{" "}
                      {pharmacy.phone || "Not specified"}
                    </p>

                    {pharmacy.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                        {pharmacy.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}