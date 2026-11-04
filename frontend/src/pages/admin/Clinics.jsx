
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function AdminClinics() {
  const { token } = useOutletContext();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadClinics() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/admin/assignable-clinics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.title || "Failed to load clinics");
      }

      setClinics(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClinics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clinics</h1>
          <p className="mt-1 text-sm text-slate-500">
            View clinics available for doctor assignments.
          </p>
        </div>

        <button
          onClick={loadClinics}
          className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-8 text-slate-500">Loading clinics...</p>
        ) : clinics.length === 0 ? (
          <p className="p-8 text-slate-500">
            No assignable clinics found.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4">Clinic</th>
                <th className="p-4">City</th>
                <th className="p-4">Address</th>
                <th className="p-4">Phone</th>
              </tr>
            </thead>

            <tbody>
              {clinics.map((clinic, index) => (
                <tr
                  key={clinic.id ?? clinic.clinicId ?? index}
                  className="border-t border-slate-100"
                >
                  <td className="p-4 font-medium text-slate-900">
                    {clinic.name || clinic.clinicName || "Unnamed clinic"}
                  </td>
                  <td className="p-4">
                    {clinic.cityName || clinic.city || "—"}
                  </td>
                  <td className="p-4">
                    {clinic.address || "—"}
                  </td>
                  <td className="p-4">
                    {clinic.phoneNumber || clinic.phone || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400">
        This page currently displays approved clinics available for doctor
        assignments. It does not edit clinic records.
      </p>
    </div>
  );
}
