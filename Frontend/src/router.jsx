// src/router.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ClientePage from "./pages/ClientePage";
import AdminPage from "./pages/AdminPage";
import TallerPage from "./pages/TallerPage";
import LoginAdmin from "./components/admin/LoginAdmin";

function ProtectedRoute({ children }) {
  const isAdmin = localStorage.getItem("motobombon_is_admin") === "true";
  return isAdmin ? children : <Navigate to="/login" replace />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/cliente" element={<ClientePage />} />
        <Route path="/reserva" element={<ClientePage />} />
        <Route path="/taller" element={<TallerPage />} />
        <Route path="/login" element={<LoginAdmin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
