// src/components/admin/AdminLayout.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import CalendarAdmin from "./CalendarAdmin";
import PanelAdmin from "./PanelAdmin";
import ServiciosManager from "./ServiciosManager";
import PromocionesManager from "./PromocionesManager";
import TalleresManager from "./TalleresManager";
import LavadoresManager from "./LavadoresManager";
import NominaManager from "./NominaManager";

export default function AdminLayout() {
  const [activeView, setActiveView] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem("motobombon_is_admin");
    window.location.href = "/login";
  };

  const renderContent = () => {
      const getPageTitle = () => {
        switch (activeView) {
          case 'dashboard': return 'Dashboard';
          case 'calendar': return 'Calendario';
          case 'appointments': return 'Citas';
          case 'services': return 'Servicios';
          case 'promociones': return 'Promociones';
          case 'talleres': return 'Talleres Aliados';
          case 'lavadores': return 'Lavadores';
          case 'nomina': return 'Nómina y CRM';
          case 'settings': return 'Ajustes';
          default: return 'Dashboard';
        }
      };    return (
      <div>
        {/* Header de la página */}
        <div className="admin-page-header">
          <h1 className="admin-page-title">{getPageTitle()}</h1>
          <p className="admin-page-subtitle">
            {activeView === 'dashboard' && 'Resumen general de tu negocio'}
            {activeView === 'calendar' && 'Gestiona las citas en el calendario'}
            {activeView === 'appointments' && 'Administra las reservas de clientes'}
            {activeView === 'services' && 'Configura servicios y precios'}
            {activeView === 'promociones' && 'Gestiona promociones con precios especiales'}
            {activeView === 'talleres' && 'Gestiona talleres aliados y sus precios especiales'}
            {activeView === 'lavadores' && 'Administra el equipo de trabajo'}
            {activeView === 'nomina' && 'Control financiero y reportes de nómina'}
            {activeView === 'settings' && 'Preferencias y configuración del sistema'}
          </p>
        </div>

        {/* Contenido de la página */}
        <div>
          {(() => {
            switch (activeView) {
              case 'dashboard':
                return <Dashboard setActiveView={setActiveView} />;
              case 'calendar':
                return <CalendarAdmin />;
              case 'appointments':
                return <PanelAdmin />;
              case 'services':
                return <ServiciosManager />;
              case 'promociones':
                return <PromocionesManager />;
              case 'talleres':
                return <TalleresManager />;
              case 'lavadores':
                return <LavadoresManager />;
              case 'nomina':
                return <NominaManager />;
              case 'settings':
                return <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuración</h2>
                  <p className="text-gray-600">Esta sección estará disponible próximamente</p>
                </div>;
              default:
                return <Dashboard />;
            }
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-shell">
      {/* Sidebar con menú hamburguesa integrado */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <div className="admin-main">
        {renderContent()}
      </div>
    </div>
  );
}