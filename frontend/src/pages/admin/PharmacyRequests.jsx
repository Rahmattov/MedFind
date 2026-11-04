
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function PharmacyRequests() {
  const { token } = useOutletContext();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/admin/pharmacy-requests?status=Pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data?.message || data?.title || "Не удалось загрузить заявки"
        );
      }

      setRequests(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadRequests();
  }, [token]);

  async function handleDecision(id, action) {
    let reason = "";

    if (action === "reject") {
      reason = window.prompt("Укажите причину отклонения заявки:");

      if (reason === null) return;

      reason = reason.trim();

      if (!reason) {
        alert("Необходимо указать причину отклонения.");
        return;
      }
    }

    setProcessingId(id);
    setError("");

    try {
      const response = await fetch(
        `${API}/admin/pharmacy-requests/${id}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          ...(action === "reject"
            ? {
                body: JSON.stringify({
                  reason,
                  rejectionReason: reason,
                }),
              }
            : {}),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            data?.detail ||
            "Не удалось обработать заявку"
        );
      }

      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Pharmacy Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and approve pharmacy registration applications.
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-semibold text-slate-800">
              No pending requests
            </p>
            <p className="mt-2 text-sm text-slate-500">
              New pharmacy applications will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">Pharmacy</th>
                  <th className="px-5 py-4">City</th>
                  <th className="px-5 py-4">Address</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {request.pharmacyName || request.name || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {request.cityName || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {request.address || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {request.pharmacyPhone || request.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleDecision(request.id, "approve")
                          }
                          disabled={processingId === request.id}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            handleDecision(request.id, "reject")
                          }
                          disabled={processingId === request.id}
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
