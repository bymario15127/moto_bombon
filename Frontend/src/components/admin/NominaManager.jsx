// src/components/admin/NominaManager.jsx
import { useState, useEffect } from 'react';

const NominaManager = () => {
  const [reporteNomina, setReporteNomina] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarReporte();
  }, [fechaInicio, fechaFin]);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/nomina?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      const data = await res.json();
      setReporteNomina(data);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      alert('Error al cargar el reporte de nómina');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const exportarExcel = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const url = `${API_URL}/api/nomina/exportar-excel?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Crear un enlace temporal para descargar el archivo
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Nomina_${fechaInicio}_a_${fechaFin}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar el archivo Excel');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #EB0463',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Cargando reporte financiero...</p>
      </div>
    );
  }

  if (!reporteNomina) {
    return <div>No hay datos disponibles</div>;
  }

  const { resumen, lavadores, servicios } = reporteNomina;
  const totalIngresosCliente = resumen.total_ingresos_cliente ?? resumen.total_ingresos ?? 0;
  const totalIngresosComisionBase = resumen.total_ingresos_comision_base ?? resumen.total_ingresos ?? 0;

  return (
    <div style={{ padding: '20px' }}>
      {/* Filtros */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(235, 4, 99, 0.1) 0%, rgba(166, 84, 149, 0.1) 100%)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '2px solid #EB0463'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1f2937' }}>📅 Seleccionar Rango de Fechas</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#1f2937' }}>Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #EB0463',
                fontSize: '15px',
                fontWeight: '500',
                background: '#f3f4f6',
                color: '#000000',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#1f2937' }}>Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #a65495',
                fontSize: '15px',
                fontWeight: '500',
                background: '#f3f4f6',
                color: '#1f2937',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            />
          </div>

          <button
            onClick={exportarExcel}
            style={{
              marginLeft: 'auto',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {/* Dashboard de Resumen */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Total Ingresos (cliente) */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>💰 Ingreso real del cliente</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatearMoneda(totalIngresosCliente)}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
            {resumen.total_servicios} servicios completados
          </div>
          <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.85 }}>
            Base comisión: {formatearMoneda(totalIngresosComisionBase)}
          </div>
        </div>

        {/* Total Nómina */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>👥 Total Nómina</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatearMoneda(resumen.total_nomina)}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
            A pagar a lavadores
          </div>
        </div>

        {/* Ganancia Neta */}
        <div style={{
          background: 'linear-gradient(135deg, #EB0463 0%, #a65495 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(235, 4, 99, 0.3)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>✨ Ganancia Neta</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatearMoneda(resumen.ganancia_neta)}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
            Margen: {resumen.margen_porcentaje}%
          </div>
        </div>
      </div>

      {/* Tabla de Nómina por Lavador */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        border: '2px solid #EB0463'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#1f2937' }}>
          👥 Reporte de Nómina - {fechaInicio} a {fechaFin}
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #EB0463 0%, #a65495 100%)', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Lavador</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Cédula</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Servicios</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Ingreso cliente</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Base comisión</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>% Comisión</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>A Pagar</th>
              </tr>
            </thead>
            <tbody>
              {lavadores.map((lavador, idx) => (
                <tr key={lavador.lavador_id} style={{
                  background: idx % 2 === 0 ? 'rgba(235, 4, 99, 0.03)' : 'transparent',
                  borderBottom: '1px solid rgba(235, 4, 99, 0.1)'
                }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{lavador.nombre}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{lavador.cedula || 'N/A'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{lavador.cantidad_servicios}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                    {formatearMoneda(lavador.total_ingreso_cliente ?? lavador.total_generado)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', color: '#6b7280' }}>
                    {formatearMoneda(lavador.total_generado)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
                    {lavador.comision_porcentaje}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#EB0463' }}>
                    {formatearMoneda(lavador.comision_a_pagar)}
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(235, 4, 99, 0.1)', fontWeight: 'bold', fontSize: '16px' }}>
                <td colSpan="2" style={{ padding: '16px' }}>TOTAL</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>{resumen.total_servicios}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>{formatearMoneda(totalIngresosCliente)}</td>
                <td style={{ padding: '16px', textAlign: 'right', color: '#6b7280' }}>{formatearMoneda(totalIngresosComisionBase)}</td>
                <td style={{ padding: '16px' }}></td>
                <td style={{ padding: '16px', textAlign: 'right', color: '#EB0463' }}>{formatearMoneda(resumen.total_nomina)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Estadísticas por Servicio */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #a65495'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#1f2937' }}>
          🏍️ Ingresos por Tipo de Servicio
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {servicios.map((servicio, idx) => (
            <div key={idx} style={{
              background: `linear-gradient(135deg, rgba(235, 4, 99, ${0.05 + idx * 0.05}) 0%, rgba(166, 84, 149, ${0.05 + idx * 0.05}) 100%)`,
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(235, 4, 99, 0.2)'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{servicio.servicio}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatearMoneda(servicio.ingreso_total)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                {servicio.cantidad} servicios ({servicio.porcentaje}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NominaManager;
