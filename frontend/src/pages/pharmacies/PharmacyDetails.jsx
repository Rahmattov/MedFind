
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function PharmacyDetails() {
  const { id } = useParams();

  const [pharmacy, setPharmacy] = useState(null);
  const [medicines, setMedicines] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);

  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Загружаем информацию об аптеке и её лекарства
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [pharmacyResponse, medicinesResponse] = await Promise.all([
          fetch(`${API}/pharmacies/${id}`),
          fetch(`${API}/pharmacies/${id}/medicines`),
        ]);

        const pharmacyData = await pharmacyResponse.json().catch(() => null);
        const medicinesData = await medicinesResponse.json().catch(() => null);

        if (!pharmacyResponse.ok) {
          throw new Error(
            pharmacyData?.message ||
              pharmacyData?.title ||
              "Pharmacy not found"
          );
        }

        if (!medicinesResponse.ok) {
          throw new Error(
            medicinesData?.message ||
              medicinesData?.title ||
              "Failed to load medicines"
          );
        }

        setPharmacy(pharmacyData);
        setMedicines(
          Array.isArray(medicinesData)
            ? medicinesData
            : medicinesData?.items || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Получаем уникальные категории
  const categories = useMemo(() => {
    return [...new Set(
      medicines
        .map((medicine) => medicine.category)
        .filter(Boolean)
    )].sort();
  }, [medicines]);

  // Поиск и фильтрация
  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch =
        !search.trim() ||
        medicine.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (medicine.manufacturer || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const matchesCategory =
        !category || medicine.category === category;

      const matchesMinPrice =
        minPrice === "" || medicine.price >= Number(minPrice);

      const matchesMaxPrice =
        maxPrice === "" || medicine.price <= Number(maxPrice);

      const matchesStock =
        !inStock || medicine.stockQuantity > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesStock
      );
    });
  }, [medicines, search, category, minPrice, maxPrice, inStock]);

  // Управление количеством
  function changeQuantity(medicineId, amount, stock) {
    setQuantities((previous) => {
      const current = previous[medicineId] || 0;
      const next = Math.max(0, Math.min(stock, current + amount));

      return {
        ...previous,
        [medicineId]: next,
      };
    });
  }

  const selectedCount = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const totalPrice = medicines.reduce((total, medicine) => {
    return total + medicine.price * (quantities[medicine.id] || 0);
  }, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-center text-slate-500">
        Loading pharmacy...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-red-50 p-6 text-red-700">
          {error}
        </div>

        <Link
          to="/pharmacies"
          className="mt-6 inline-block font-semibold text-teal-700"
        >
          ← Back to pharmacies
        </Link>
      </div>
    );
  }

  if (!pharmacy) return null;

  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <Link
          to="/pharmacies"
          className="text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          ← Back to pharmacies
        </Link>

        {/* Pharmacy information */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-2">
            {pharmacy.photoUrl ? (
              <img
                src={pharmacy.photoUrl}
                alt={pharmacy.name}
                className="h-64 w-full object-cover md:h-full"
              />
            ) : (
              <div className="flex min-h-64 items-center justify-center bg-teal-50">
                <span className="text-7xl">💊</span>
              </div>
            )}

            <div className="p-8">
              <span className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                Pharmacy
              </span>

              <h1 className="mt-3 text-3xl font-bold text-brand-900">
                {pharmacy.name}
              </h1>

              <p className="mt-3 text-slate-500">
                {pharmacy.description || "Welcome to our pharmacy."}
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <p>
                  <strong>City:</strong>{" "}
                  {pharmacy.cityName || "Not specified"}
                </p>

                <p>
                  <strong>Address:</strong>{" "}
                  {pharmacy.address || "Not specified"}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {pharmacy.phone || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medicine catalogue */}
        <div className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mt-2 text-sm text-slate-500">
                Find the medicines you need.
              </p>
            </div>

            <div className="rounded-xl bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-800">
              {filteredMedicines.length} products
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search medicines
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Medicine name or manufacturer..."
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 outline-none focus:border-teal-600"
              >
                <option value="">All categories</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Min price
              </label>

              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="From"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Max price
              </label>

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="To"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-teal-600"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 lg:col-span-5">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="h-4 w-4 accent-teal-700"
              />
              Show only available medicines
            </label>
          </div>

          {/* Products */}
          {filteredMedicines.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-12 text-center">
              <div className="text-5xl">🔍</div>

              <h3 className="mt-4 text-xl font-bold text-slate-800">
                No medicines found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMedicines.map((medicine) => {
                const quantity = quantities[medicine.id] || 0;

                return (
                  <div
                    key={medicine.id}
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    {medicine.photoUrl ? (
                      <img
                        src={medicine.photoUrl}
                        alt={medicine.name}
                        className="h-48 w-full bg-white object-contain p-4"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-teal-50">
                        <span className="text-6xl">💊</span>
                      </div>
                    )}

                    <div className="p-5">
                      {medicine.category && (
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                          {medicine.category}
                        </span>
                      )}

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {medicine.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {[medicine.manufacturer, medicine.dosage, medicine.form]
                          .filter(Boolean)
                          .join(" • ") || "Medicine"}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold text-brand-900">
                          {medicine.price.toLocaleString("ru-RU")} ₸
                        </span>

                        <span
                          className={`text-xs font-medium ${
                            medicine.stockQuantity > 0
                              ? "text-green-700"
                              : "text-red-600"
                          }`}
                        >
                          {medicine.stockQuantity > 0
                            ? `${medicine.stockQuantity} in stock`
                            : "Out of stock"}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between rounded-xl border border-stone-200 p-2">
                        <button
                          type="button"
                          disabled={quantity === 0}
                          onClick={() =>
                            changeQuantity(medicine.id, -1, medicine.stockQuantity)
                          }
                          className="h-9 w-9 rounded-lg bg-stone-100 text-lg font-bold disabled:opacity-40"
                        >
                          −
                        </button>

                        <span className="font-semibold text-slate-800">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={quantity >= medicine.stockQuantity}
                          onClick={() =>
                            changeQuantity(medicine.id, 1, medicine.stockQuantity)
                          }
                          className="h-9 w-9 rounded-lg bg-teal-700 text-lg font-bold text-white disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selection summary */}
        {selectedCount > 0 && (
          <div className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 items-center justify-between gap-4 rounded-2xl bg-brand-900 px-6 py-4 text-white shadow-xl">
            <div>
              <p className="font-semibold">
                Selected: {selectedCount} items
              </p>

              <p className="mt-1 text-sm text-white/70">
                Total: {totalPrice.toLocaleString("ru-RU")} ₸
              </p>
            </div>

            <span className="text-sm text-white/70">
              Cart preview
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
