
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function ClinicRequests() {
  const { token } = useOutletContext();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || data?.title || "Request failed");
    }

    return data;
  }

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const data = await request("/admin/clinic-requests?status=Pending");
      setRequests(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveRequest(id) {
    setBusyId(id);
    setError("");
    setNotice("");

    try {
      await request(`/admin/clinic-requests/${id}/approve`, {
        method: "POST",
      });

      setNotice("Clinic request approved successfully.");
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function rejectRequest(id) {
    if (!reason.trim()) {
      setError("Please enter a reason for rejection.");
      return;
    }

    setBusyId(id);
    setError("");
    setNotice("");

    try {
      await request(`/admin/clinic-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });

      setNotice("Clinic request rejected.");
      setRejectingId(null);
      setReason("");
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Clinic Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review clinic registration applications.
          </p>
        </div>

        <button
          onClick={loadRequests}
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

      {notice && (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          Loading clinic requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-800">
            No pending requests
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            All clinic applications have been reviewed.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((item) => {
            const id = item.id ?? item.requestId;

            return (
              <div
                key={id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {item.clinicName || item.name || "Unnamed clinic"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.cityName || item.city || "City not specified"}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Info label="Address" value={item.address} />
                  <Info
                    label="Phone"
                    value={item.clinicPhone || item.phoneNumber || item.phone}
                  />
                  <Info
                    label="Manager"
                    value={item.managerName || item.manager}
                  />
                  <Info
                    label="Email"
                    value={item.email || item.managerEmail}
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    disabled={busyId === id}
                    onClick={() => approveRequest(id)}
                    className="rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {busyId === id ? "Please wait..." : "Approve"}
                  </button>

                  <button
                    disabled={busyId === id}
                    onClick={() => {
                      setRejectingId(rejectingId === id ? null : id);
                      setReason("");
                      setError("");
                    }}
                    className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>

                {rejectingId === id && (
                  <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Reason for rejection
                    </label>

                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why this application is rejected..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-teal-600"
                    />

                    <div className="flex gap-3">
                      <button
                        disabled={busyId === id}
                        onClick={() => rejectRequest(id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Confirm rejection
                      </button>

                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setReason("");
                        }}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}
