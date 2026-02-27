import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReservaForm from "../components/Cliente/ReservaForm";
import "../index.css";

export default function ClientePage() {
  const location = useLocation();

  useEffect(() => {
    // Prevenir navegación hacia atrás solo si se accede directamente a /cliente o /reserva
    const fromHome = location.state?.fromHome;
    
    if (!fromHome) {
      // Reemplazar el historial para que no puedan volver
      window.history.pushState(null, "", window.location.href);
      
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [location]);

  return (
    <div className="centered-page">
      <div className="container">
        <h1 className="text-3xl font-bold text-center mb-6" style={{ color: '#EB0463' }}>
          🏍️ MOTOBOMBON — Reserva tu servicio de lavado
        </h1>
        <ReservaForm />
      </div>
    </div>
  );
}
