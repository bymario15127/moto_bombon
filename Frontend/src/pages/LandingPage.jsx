// src/pages/LandingPage.jsx
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="centered-page" style={{ background: '#000000' }}>
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ 
            fontFamily: 'Yeseva One, serif', 
            fontSize: '3rem', 
            color: '#ffffff',
            textShadow: '0 0 20px #EB0463',
            marginBottom: '1rem'
          }}>
            MOTOBOMBON
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#cccccc' }}>
            Tu moto brillante como nueva 🏍️✨
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gap: '1.5rem',
          marginTop: '3rem'
        }}>
          <button
            onClick={() => navigate('/reserva')}
            style={{
              padding: '2rem',
              fontSize: '1.3rem',
              fontWeight: '600',
              borderRadius: '20px',
              border: '2px solid #EB0463',
              background: 'linear-gradient(135deg, #EB0463, #ff1a75)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(235,4,99,0.5)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = '0 12px 35px rgba(235,4,99,0.7)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(235,4,99,0.5)';
            }}
          >
            🏍️ Soy Cliente
          </button>

          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '1.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              borderRadius: '16px',
              border: '2px solid #e5e7eb',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.borderColor = '#EB0463';
              e.target.style.color = '#EB0463';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.color = '#374151';
            }}
          >
            🔒 Administración
          </button>

          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '1.2rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '14px',
              border: '2px solid #a78bfa',
              background: '#f3e8ff',
              color: '#6d28d9',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(168,85,247,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.borderColor = '#6d28d9';
              e.target.style.background = '#ede9fe';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.borderColor = '#a78bfa';
              e.target.style.background = '#f3e8ff';
            }}
          >
            👁️ Supervisor
          </button>
        </div>

        <p style={{ 
          marginTop: '2rem', 
          fontSize: '0.875rem', 
          color: '#888888' 
        }}>
          Bienvenido a MOTOBOMBON - Tu lavamotors de confianza
        </p>
      </div>
    </div>
  );
}
