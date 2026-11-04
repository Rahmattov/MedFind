
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function Patients() {
  const { token } = useOutletContext();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  async function loadPatients() {
    setLoading(true);
    setError("");

    try {
      const data = await request(
        `/admin/clients?q=${encodeURIComponent(search)}`
      );

      setPatients(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openPatient(id) {
    setSelectedPatient(null);
    setDetailsLoading(true);
    setError("");

    try {
      const data = await request(`/admin/clients/${id}`);
      setSelectedPatient(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function toggleStatus(patient) {
    const id = patient.id ?? patient.clientId;
    const isActive = !(patient.isActive ?? true);

    setBusyId(id);
    setError("");
    setNotice("");

    try {
      await request(`/admin/clients/${id}/active`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      });

      setNotice(isActive ? "Patient activated." : "Patient deactivated.");

      await loadPatients();

      if (selectedPatient) {
        await openPatient(id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  function getId(patient) {
    return patient.id ?? patient.clientId;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage registered patients and their account status.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadPatients();
          }}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-600"
        />

        <button
          onClick={loadPatients}
          className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
        >
          Search
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

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-8 text-slate-500">Loading patients...</p>
        ) : patients.length === 0 ? (
          <p className="p-8 text-slate-500">No patients found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((patient) => {
                const id = getId(patient);
                const active = patient.isActive ?? true;

                return (
                  <tr key={id} className="border-t border-slate-100">
                    <td className="p-4 font-medium text-slate-900">
                      {patient.fullName || "Unnamed"}
                    </td>
                    <td className="p-4">{patient.email || "—"}</td>
                    <td className="p-4">{patient.phoneNumber || "—"}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openPatient(id)}
                          className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                        >
                          Details
                        </button>

                        <button
                          disabled={busyId === id}
                          onClick={() => toggleStatus(patient)}
                          className={`rounded-lg px-3 py-2 text-white disabled:opacity-50 ${
                            active
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {busyId === id
                            ? "Please wait..."
                            : active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(selectedPatient || detailsLoading) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Patient details
            </h2>
            <button
              onClick={() => setSelectedPatient(null)}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          {detailsLoading ? (
            <p className="text-slate-500">Loading details...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Full name" value={selectedPatient?.fullName} />
              <Detail label="Email" value={selectedPatient?.email} />
              <Detail label="Phone" value={selectedPatient?.phoneNumber} />
              <Detail label="City" value={selectedPatient?.cityName} />
              <Detail label="Date of birth" value={selectedPatient?.dateOfBirth} />
              <Detail label="Gender" value={selectedPatient?.gender} />
              <Detail
                label="Appointments"
                value={selectedPatient?.appointmentsCount}
              />
              <Detail
                label="Status"
                value={
                  selectedPatient?.isActive === false ? "Inactive" : "Active"
                }
              />
            </div>
          )}

          <p className="mt-5 text-xs text-slate-400">
            Passwords are never displayed in the admin panel.
          </p>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value ?? "—"}</p>
    </div>
  );
}
