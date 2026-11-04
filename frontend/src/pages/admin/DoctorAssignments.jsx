
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function DoctorAssignments() {
  const { token } = useOutletContext();

  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinics, setSelectedClinics] = useState({});

  const [loading, setLoading] = useState(true);
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

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [doctorsData, clinicsData] = await Promise.all([
        request("/admin/doctors-without-clinics"),
        request("/admin/assignable-clinics"),
      ]);

      setDoctors(
        Array.isArray(doctorsData) ? doctorsData : doctorsData?.items || []
      );

      setClinics(
        Array.isArray(clinicsData) ? clinicsData : clinicsData?.items || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function assignClinic(doctor) {
    const doctorId = doctor.id ?? doctor.doctorId;
    const clinicId = selectedClinics[doctorId];

    if (!clinicId) {
      setError("Please select a clinic first.");
      return;
    }

    setBusyId(doctorId);
    setError("");
    setNotice("");

    try {
      await request(
        `/admin/doctors/${doctorId}/clinics/${clinicId}`,
        { method: "PUT" }
      );

      setNotice(`Clinic successfully assigned to ${doctor.fullName || "doctor"}.`);

      setSelectedClinics((prev) => ({
        ...prev,
        [doctorId]: "",
      }));

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getDoctorId(doctor) {
    return doctor.id ?? doctor.doctorId;
  }

  function getClinicId(clinic) {
    return clinic.id ?? clinic.clinicId;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Doctor Assignments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign available clinics to doctors who currently have no clinic.
          </p>
        </div>

        <button
          onClick={loadData}
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
          Loading assignments...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Doctors without clinics"
              value={doctors.length}
            />
            <StatCard
              label="Available clinics"
              value={clinics.length}
            />
          </div>

          {doctors.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-800">
                No doctors need assignment
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                All listed doctors already have a clinic.
              </p>
            </div>
          ) : clinics.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No assignable clinics are available.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Select clinic</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {doctors.map((doctor) => {
                    const doctorId = getDoctorId(doctor);

                    return (
                      <tr
                        key={doctorId}
                        className="border-t border-slate-100"
                      >
                        <td className="p-4 font-medium text-slate-900">
                          {doctor.fullName || "Unnamed"}
                        </td>

                        <td className="p-4">
                          {doctor.email || "—"}
                        </td>

                        <td className="p-4">
                          <select
                            value={selectedClinics[doctorId] || ""}
                            onChange={(e) =>
                              setSelectedClinics((prev) => ({
                                ...prev,
                                [doctorId]: e.target.value,
                              }))
                            }
                            className="min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-600"
                          >
                            <option value="">Choose a clinic</option>

                            {clinics.map((clinic) => {
                              const clinicId = getClinicId(clinic);

                              return (
                                <option key={clinicId} value={clinicId}>
                                  {clinic.name ||
                                    clinic.clinicName ||
                                    `Clinic #${clinicId}`}
                                </option>
                              );
                            })}
                          </select>
                        </td>

                        <td className="p-4">
                          <button
                            disabled={busyId === doctorId}
                            onClick={() => assignClinic(doctor)}
                            className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                          >
                            {busyId === doctorId ? "Assigning..." : "Assign"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
