// src/components/admin/CalendarAdmin.jsx
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCitas, updateCita } from '../../services/citasService';

const CalendarAdmin = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dayAppointments, setDayAppointments] = useState([]);

  // Cargar todas las citas
  useEffect(() => {
    loadCitas();
  }, []);

  // Filtrar citas del día seleccionado (comparación por string para evitar problemas de zona horaria)
  useEffect(() => {
    if (citas.length > 0) {
      const selectedKey = format(selectedDate, 'yyyy-MM-dd');
      const filtered = citas.filter(cita => cita.fecha === selectedKey);
      setDayAppointments(filtered);
    }
  }, [selectedDate, citas]);

  const loadCitas = async () => {
    try {
      setLoading(true);
      const data = await getCitas();
      setCitas(data);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCitaStatus = async (id, newStatus) => {
    try {
      await updateCita(id, { estado: newStatus });
      await loadCitas(); // Recargar citas
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      alert('Error al actualizar el estado de la cita');
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'pendiente';
      case 'confirmada': return 'confirmada';
      case 'en curso': return 'en-curso';
      case 'finalizada': return 'finalizada';
      case 'cancelada': return 'cancelada';
      default: return '';
    }
  };

  const formatTime = (hora) => hora;

  // Helper para obtener la llave de fecha en formato YYYY-MM-DD
  const getDateKey = (date) => format(date, 'yyyy-MM-dd');

  return (
    <div className="calendar-page">
      <h2 className="page-title">📅 Calendario de Citas</h2>

      <div className="calendar-grid">
        {/* Calendario */}
        <div className="card">
          <h3 className="card-title">Seleccionar Fecha</h3>
          <div className="calendar-container">
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              inline
              locale={es}
              className="w-full"
              dayClassName={(date) => {
                const hasAppointment = citas.some(cita => cita.fecha === getDateKey(date));
                return hasAppointment ? 'has-appointment' : '';
              }}
            />
          </div>
        </div>

        {/* Citas del día seleccionado */}
        <div className="card">
          <h3 className="card-title">
            Citas para {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </h3>

          {loading ? (
            <div className="empty-state">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a65495] mx-auto"></div>
              <p className="mt-2">Cargando citas...</p>
            </div>
          ) : dayAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗓️</div>
              <h3>No hay citas programadas para este día</h3>
              <p>Selecciona otra fecha en el calendario</p>
            </div>
          ) : (
            <div className="apt-list max-h-96 overflow-y-auto">
              {dayAppointments.map((cita) => (
                <div key={cita.id} className="apt-card">
                  <div className="apt-header">
                    <div>
                      <h4 className="apt-title">{cita.cliente}</h4>
                      <p className="apt-line">📞 {cita.telefono}</p>
                      {cita.email && <p className="apt-line">📧 {cita.email}</p>}
                      <p className="apt-line">🕐 {formatTime(cita.hora)}</p>
                      <p className="apt-line">💅 {cita.servicio}</p>
                    </div>
                    <span className={`badge ${getStatusColor(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>

                  {cita.comentarios && (
                    <div className="apt-notes">
                      <strong>Comentarios:</strong> {cita.comentarios}
                    </div>
                  )}

                  {(cita.placa || cita.marca || cita.modelo || cita.cilindraje) && (
                    <div className="apt-notes" style={{borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px'}}>
                      <strong>🏍️ Datos de la Moto:</strong>
                      <div style={{marginTop: '4px', fontSize: '13px'}}>
                        {cita.placa && <div>Placa: {cita.placa}</div>}
                        {cita.marca && <div>Marca: {cita.marca}</div>}
                        {cita.modelo && <div>Modelo: {cita.modelo}</div>}
                        {cita.cilindraje && <div>Cilindraje: {cita.cilindraje} cc</div>}
                      </div>
                    </div>
                  )}

                  <div className="apt-actions">
                    {cita.estado === 'pendiente' && (
                      <button
                        onClick={() => updateCitaStatus(cita.id, 'confirmada')}
                        className="btn btn-success btn-sm"
                      >
                        ✅ Confirmar
                      </button>
                    )}

                    {['pendiente', 'confirmada', 'en curso'].includes(cita.estado) && (
                      <button
                        onClick={() => updateCitaStatus(cita.id, cita.estado === 'en curso' ? 'finalizada' : 'en curso')}
                        className="btn btn-primary btn-sm"
                      >
                        {cita.estado === 'en curso' ? '✨ Finalizar' : '🔄 En curso'}
                      </button>
                    )}

                    {cita.estado !== 'cancelada' && (
                      <button
                        onClick={() => updateCitaStatus(cita.id, 'cancelada')}
                        className="btn btn-danger btn-sm"
                      >
                        ❌ Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen del día */}
      <div className="stats-grid">
        <div className="stat-card yellow">
          <h4>Pendientes</h4>
          <p className="stat-value">{dayAppointments.filter(c => c.estado === 'pendiente').length}</p>
        </div>
        <div className="stat-card green">
          <h4>Confirmadas</h4>
          <p className="stat-value">{dayAppointments.filter(c => c.estado === 'confirmada').length}</p>
        </div>
        <div className="stat-card purple">
          <h4>Finalizadas</h4>
          <p className="stat-value">{dayAppointments.filter(c => c.estado === 'finalizada').length}</p>
        </div>
        <div className="stat-card red">
          <h4>Canceladas</h4>
          <p className="stat-value">{dayAppointments.filter(c => c.estado === 'cancelada').length}</p>
        </div>
      </div>
    </div>
  );
};

export default CalendarAdmin;
