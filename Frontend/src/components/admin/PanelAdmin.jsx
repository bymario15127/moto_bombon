// src/components/Admin/PanelAdmin.jsx
import { useEffect, useState } from "react";
import { getCitas, deleteCita, updateCita } from "../../services/citasService";
import { getLavadoresActivos } from "../../services/lavadoresService";

export default function PanelAdmin() {
  const [citas, setCitas] = useState([]);
  const [lavadores, setLavadores] = useState([]);
  const [userRole, setUserRole] = useState('admin');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('motobombon_user_role') || 'admin';
    setUserRole(role);
  }, []);

  // Función para formatear fecha correctamente sin problemas de timezone
  const formatearFecha = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-');
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para capitalizar primera letra
  const capitalizar = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const load = async () => {
    const data = await getCitas(); // Esto ya trae solo citas del día actual (sin ?all=true)
    setCitas(data);
  };

  const loadLavadores = async () => {
    try {
      const data = await getLavadoresActivos();
      setLavadores(data);
    } catch (error) {
      console.error('Error al cargar lavadores:', error);
    }
  };

  useEffect(() => {
    load();
    loadLavadores();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Eliminar esta cita?")) return;
    await deleteCita(id);
    load();
  };

  const changeEstado = async (id, nuevoEstado) => {
    // Si se está finalizando una cita, verificar que tenga lavador asignado
    if (nuevoEstado === "finalizada") {
      const cita = citas.find(c => c.id === id);
      if (!cita.lavador_id) {
        alert("⚠️ Debes asignar un lavador antes de finalizar la cita");
        return;
      }
    }
    await updateCita(id, { estado: nuevoEstado });
    load();
  };

  const updateCitaLavador = async (id, lavadorId) => {
    try {
      await updateCita(id, { lavador_id: lavadorId });
      load();
    } catch (error) {
      console.error('Error al asignar lavador:', error);
      alert('Error al asignar el lavador');
    }
  };

  // Filtrar citas por nombre de cliente o placa
  const citasFiltradas = citas.filter(cita => {
    const busquedaLower = busqueda.toLowerCase();
    return (
      (cita.cliente && cita.cliente.toLowerCase().includes(busquedaLower)) ||
      (cita.placa && cita.placa.toLowerCase().includes(busquedaLower))
    );
  });

  return (
    <div className="container">
      <div className="admin-header">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#EB0463' }}>Panel Admin — MOTOBOMBON</h2>
          <p className="text-gray-600">Total citas: <span className="font-semibold" style={{ color: '#EB0463' }}>{citasFiltradas.length}</span></p>
        </div>
      </div>

      {/* Buscador */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o placa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: 1,
            maxWidth: '500px',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '3px solid #ff1744',
            fontSize: '18px',
            fontWeight: '700',
            background: '#2d3748',
            color: '#ffffff',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            caretColor: '#ff1744',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 0 20px rgba(255, 23, 68, 0.7)';
            e.target.style.borderColor = '#ff5252';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            e.target.style.borderColor = '#ff1744';
          }}
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            style={{
              padding: '10px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#dc2626'}
            onMouseLeave={(e) => e.target.style.background = '#ef4444'}
          >
            ✕ Limpiar
          </button>
        )}
      </div>
      
      <div className="citas-grid">
        {citasFiltradas.length === 0 ? (
          <div className="no-citas">
            <p className="text-gray-500 text-lg">
              {busqueda ? `📭 No se encontraron citas para "${busqueda}"` : '📅 No hay citas registradas'}
            </p>
          </div>
        ) : (
          [...citasFiltradas].reverse().map(c => (
            <div key={c.id} className="cita-card-admin">
              <div className="cita-header">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{c.cliente}</h3>
                  <p className="text-lg text-[#a65495] font-medium">{c.servicio}</p>
                </div>
                <span className={`estado-badge ${c.estado || 'pendiente'}`}>
                  {c.estado || "pendiente"}
                </span>
              </div>
              
              <div className="cita-details">
                <div>
                  <p className="detail-item">📅 <strong>Fecha:</strong> {capitalizar(formatearFecha(c.fecha))}</p>
                  <p className="detail-item">🕐 <strong>Hora:</strong> {c.hora || '— (orden de llegada)'}</p>
                </div>
                <div>
                  <p className="detail-item">📞 <strong>Teléfono:</strong> {c.telefono || 'No proporcionado'}</p>
                  {c.email && (
                    <p className="detail-item">📧 <strong>Email:</strong> {c.email}</p>
                  )}
                  {c.comentarios && (
                    <p className="detail-item">💬 <strong>Comentarios:</strong> {c.comentarios}</p>
                  )}
                </div>
                {(c.placa || c.marca || c.modelo || c.cilindraje) && (
                  <div style={{gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px'}}>
                    <p style={{fontWeight: 'bold', marginBottom: '8px'}}>🏍️ Datos de la Moto:</p>
                    {c.placa && <p className="detail-item">🆔 <strong>Placa:</strong> {c.placa}</p>}
                    {c.marca && <p className="detail-item">🔧 <strong>Marca:</strong> {c.marca}</p>}
                    {c.modelo && <p className="detail-item">📋 <strong>Modelo:</strong> {c.modelo}</p>}
                    {c.cilindraje && <p className="detail-item">⚙️ <strong>Cilindraje:</strong> {c.cilindraje} cc</p>}
                  </div>
                )}
                {c.metodo_pago && (
                  <div style={{gridColumn: '1 / -1', borderTop: '1px dashed #e5e7eb', paddingTop: '12px', marginTop: '8px'}}>
                    <p className="detail-item">💳 <strong>Método de pago:</strong> {c.metodo_pago === 'codigo_qr' ? 'Código QR' : 'Efectivo'}</p>
                  </div>
                )}
                {c.lavador_nombre && (
                  <div style={{gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px'}}>
                    <p className="detail-item">👤 <strong>Lavador asignado:</strong> {c.lavador_nombre}</p>
                  </div>
                )}
                <div style={{gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151'}}>
                    👤 Asignar lavador: {!c.lavador_id && <span style={{color: '#EF4444', fontSize: '12px'}}>(Requerido para finalizar)</span>}
                  </label>
                  <select
                    value={c.lavador_id || ''}
                    onChange={(e) => updateCitaLavador(c.id, e.target.value || null)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: !c.lavador_id ? '2px solid #EF4444' : '1px solid rgba(102, 126, 234, 0.3)',
                      fontSize: '14px',
                      background: !c.lavador_id 
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      color: '#1f2937',
                      cursor: 'pointer',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <option value="">⚠️ Sin asignar</option>
                    {lavadores.map(lav => (
                      <option key={lav.id} value={lav.id}>
                        {lav.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="cita-actions">
                <button 
                  onClick={() => changeEstado(c.id, "confirmada")}
                  className="btn-action confirm"
                >
                  ✅ Confirmar
                </button>
                <button 
                  onClick={() => changeEstado(c.id, "en curso")}
                  className="btn-action progress"
                >
                  🔄 En curso
                </button>
                <button 
                  onClick={() => changeEstado(c.id, "finalizada")}
                  className="btn-action complete"
                  disabled={!c.lavador_id}
                  style={{
                    opacity: !c.lavador_id ? 0.5 : 1,
                    cursor: !c.lavador_id ? 'not-allowed' : 'pointer'
                  }}
                  title={!c.lavador_id ? 'Debes asignar un lavador primero' : 'Finalizar cita'}
                >
                  ✨ Finalizar
                </button>
                {userRole === 'admin' && (
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="btn-action delete"
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
