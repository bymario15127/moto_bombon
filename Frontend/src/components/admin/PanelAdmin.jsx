// src/components/Admin/PanelAdmin.jsx
import { useEffect, useState } from "react";
import { getCitas, deleteCita, updateCita } from "../../services/citasService";

export default function PanelAdmin() {
  const [citas, setCitas] = useState([]);

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
    const data = await getCitas();
    setCitas(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Eliminar esta cita?")) return;
    await deleteCita(id);
    load();
  };

  const changeEstado = async (id, nuevoEstado) => {
    await updateCita(id, { estado: nuevoEstado });
    load();
  };

  return (
    <div className="container">
      <div className="admin-header">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#EB0463' }}>Panel Admin — MOTOBOMBON</h2>
          <p className="text-gray-600">Total citas: <span className="font-semibold" style={{ color: '#EB0463' }}>{citas.length}</span></p>
        </div>
      </div>
      
      <div className="citas-grid">
        {citas.length === 0 ? (
          <div className="no-citas">
            <p className="text-gray-500 text-lg">📅 No hay citas registradas</p>
          </div>
        ) : (
          citas.map(c => (
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
                >
                  ✨ Finalizar
                </button>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="btn-action delete"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
