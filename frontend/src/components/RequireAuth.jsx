import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RequireAuth({ children }) {
  const { patient, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <p className="mx-auto max-w-6xl px-6 py-16 text-slate-500">
        Загружаем профиль...
      </p>
    );
  }
  if (!patient) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
