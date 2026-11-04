
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

async function request(path, token) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Ошибка загрузки: ${response.status}`);
  }

  return response.json();
}

export default function AdminDashboard() {
  const { token } = useOutletContext();

  const [stats, setStats] = useState({
    doctors: 0,
    verified: 0,
    clinics: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const [doctors, clinics, requests] = await Promise.all([
          request("/admin/doctors", token),
          request("/admin/assignable-clinics", token),
          request("/admin/clinic-requests?status=Pending", token),
        ]);

        const doctorList = Array.isArray(doctors)
          ? doctors
          : doctors?.items ?? doctors?.doctors ?? [];

        const clinicList = Array.isArray(clinics)
          ? clinics
          : clinics?.items ?? [];

        const pendingList = Array.isArray(requests)
          ? requests
          : requests?.items ?? [];

        setStats({
          doctors: doctorList.length,
          verified: doctorList.filter((d) => d.isVerified).length,
          clinics: clinicList.length,
          pending: pendingList.length,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) loadStats();
  }, [token]);

  const cards = [
    { title: "Total Doctors", value: stats.doctors, icon: "⚕" },
    { title: "Verified Doctors", value: stats.verified, icon: "✓" },
    { title: "Active Clinics", value: stats.clinics, icon: "▦" },
    { title: "Pending Requests", value: stats.pending, icon: "▤" },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-brand-700">
          MEDFIND / OVERVIEW
        </p>
        <h1 className="mt-2 text-3xl font-bold text-brand-900">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-500">
          Overview of your healthcare platform.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {card.title}
              </p>
              <span className="text-2xl text-brand-700">
                {card.icon}
              </span>
            </div>

            <p className="mt-5 text-4xl font-bold text-brand-900">
              {loading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-brand-900">
          Welcome to MedFind Admin
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Use the sidebar to manage patients, doctors, clinics and
          clinic applications.
        </p>
      </div>
    </div>
  );
}
