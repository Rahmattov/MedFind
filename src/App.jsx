import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";

import Home from "./pages/Home";
import DoctorSearch from "./pages/DoctorSearch";
import DoctorProfile from "./pages/DoctorProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-sand text-slate-800">
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/search" element={<DoctorSearch />} />

          <Route path="/doctor/:id" element={<DoctorProfile />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/profile-demo"
            element={<Navigate to="/doctor/1" replace />}
          />
          
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-6xl px-6 py-20 text-center">
                <h1 className="font-display text-5xl text-brand-900">
                  404
                </h1>

                <p className="mt-3 text-slate-500">
                  Page not found
                </p>
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="mt-16 border-t border-stone-200 bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-slate-500">
          <span>© 2026 MedFind</span>
          <span>Almaty, Kazakhstan</span>
        </div>
      </footer>
    </div>
  );
}
