import { useState } from 'react';
import logo from '../../assets/motobombon.ico';

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'calendar', icon: '📅', label: 'Calendario' },
    { id: 'appointments', icon: '📋', label: 'Citas' },
    { id: 'services', icon: '🏍️', label: 'Servicios' },
    { id: 'lavadores', icon: '👤', label: 'Lavadores' },
    { id: 'nomina', icon: '💰', label: 'Nómina' },
    { id: 'settings', icon: '⚙️', label: 'Ajustes' },
  ];

  const handleItemClick = (id) => {
    setActiveView(id);
    setIsOpen(false);
  };

  return (
    <>
      <button className="hamburger-btn" onClick={() => setIsOpen(true)}>
        ☰
      </button>

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sb-wrap">
          <div className="sb-header">
            <div className="sb-logo">
              <img src={logo} alt="MOTOBOMBON" style={{width: '32px', height: '32px', borderRadius: '50%'}} />
            </div>
            <div className="sb-brand">MOTOBOMBON</div>
            <button className="sidebar-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <nav className="sb-nav">
            <ul className="sb-list">
              {menuItems.map((item) => (
                <li key={item.id} className="sb-li">
                  <button
                    className={`sb-item ${activeView === item.id ? 'active' : ''}`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <span className="sb-ic">{item.icon}</span>
                    <span className="sb-tx">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sb-footer">
            <div className="sb-user">
              <div className="sb-avatar">PE</div>
              <div className="sb-user-txt">
                <div className="sb-user-name">Paula Espinosa</div>
              </div>
            </div>
            <button className="sb-logout" onClick={onLogout}>
               Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
