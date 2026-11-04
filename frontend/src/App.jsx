
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Pharmacies from "./pages/pharmacies/Pharmacies";
import Header from "./components/Header";
import PharmacyRegister from "./pages/pharmacies/PharmacyRegister";
import PharmacyRequests from "./pages/admin/PharmacyRequests";
import PharmacyDetails from "./pages/pharmacies/PharmacyDetails";

import Home from "./pages/Home";
import DoctorSearch from "./pages/DoctorSearch";
import DoctorProfile from "./pages/DoctorProfile";
import ClinicDashboard from "./pages/clinics/ClinicDashboard";

import PatientLogin from "./pages/PatientLogin";
import Register from "./pages/Register";
import PatientProfile from "./pages/PatientProfile";

import RequireAuth from "./components/RequireAuth";

import Clinics from "./pages/clinics/clinics";
import ClinicRegister from "./pages/clinics/ClinicRegister";
import ClinicDetails from "./pages/clinics/ClinicDetails";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Patients from "./pages/admin/Patients";
import Doctors from "./pages/admin/Doctors";
import AdminClinics from "./pages/admin/Clinics";
import ClinicRequests from "./pages/admin/ClinicRequests";
import DoctorAssignments from "./pages/admin/DoctorAssignments";

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-sand text-slate-800">
      {!isAdminRoute && <Header />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="clinics" element={<AdminClinics />} />
            <Route path="clinic-requests" element={<ClinicRequests />} />
            <Route path="pharmacy-requests" element={<PharmacyRequests />} />
            <Route path="doctor-assignments" element={<DoctorAssignments />} />
          </Route>

          <Route path="/search" element={<DoctorSearch />} />
          <Route path="/doctor/:id" element={<DoctorProfile />} />

          <Route path="/clinics" element={<Clinics />} />
          <Route path="/pharmacies" element={<Pharmacies />} />
          <Route path="/pharmacies/:id" element={<PharmacyDetails />} />
          <Route path="/clinics/register" element={<ClinicRegister />} />
          <Route path="/clinics/:id" element={<ClinicDetails />} />

          <Route path="/login" element={<PatientLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pharmacies/register" element={<PharmacyRegister />} />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <PatientProfile />
              </RequireAuth>
            }
          />

          <Route path="/dashboard" element={<ClinicDashboard />} />

          <Route
            path="/profile-demo"
            element={<Navigate to="/doctor/1" replace />}
          />

          <Route
            path="/clinic-dashboard"
            element={
              <RequireAuth>
                <ClinicDashboard />
              </RequireAuth>
            }
          />

          <Route
            path="*"
            element={
              <div className="mx-auto max-w-6xl px-6 py-20 text-center">
                <h1 className="text-5xl font-bold text-brand-900">404</h1>
                <p className="mt-3 text-slate-500">Страница не найдена</p>
              </div>
            }
          />
        </Routes>
      </main>

      {!isAdminRoute && (
        <footer className="mt-16 border-t border-stone-200 bg-white/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-slate-500">
            <span>© 2026 MedFind</span>
            <span>Almaty, Kazakhstan</span>
          </div>
        </footer>
      )}
    </div>
  );
}
