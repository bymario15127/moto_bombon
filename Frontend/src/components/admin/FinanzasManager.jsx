// Frontend/src/components/admin/FinanzasManager.jsx
import { useState, useEffect } from "react";
import { getDashboard, getGastos, crearGasto, actualizarGasto, eliminarGasto, getMovimientos } from "../../services/finanzasService";

export default function FinanzasManager() {
  const [dashboard, setDashboard] = useState(null);
  const [gastos, setGastos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState("dashboard");
  
  // Formulario
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    tipo: "fijo",
    categoria: "alquiler",
    descripcion: "",
    monto: "",
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: "efectivo",
    estado: "completado",
    notas: ""
  });

  // Filtros (mes/año o rango)
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [desde, setDesde] = useState(firstOfMonthStr);
  const [hasta, setHasta] = useState(todayStr);

  useEffect(() => {
    cargarDatos();
  }, [mes, anio, desde, hasta]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dashData, gastosData, movData] = await Promise.all([
        getDashboard(mes, anio, desde, hasta),
        getGastos({}),
        getMovimientos(mes, anio)
      ]);
      setDashboard(dashData);
      setGastos(gastosData);
      setMovimientos(movData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error cargando datos financieros");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await actualizarGasto(editandoId, formData);
      } else {
        await crearGasto(formData);
      }
      setMostrarForm(false);
      setEditandoId(null);
      resetForm();
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditar = (gasto) => {
    setFormData({
      tipo: gasto.tipo,
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      metodo_pago: gasto.metodo_pago || "efectivo",
      estado: gasto.estado,
      notas: gasto.notas || ""
    });
    setEditandoId(gasto.id);
    setMostrarForm(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    try {
      await eliminarGasto(id);
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: "fijo",
      categoria: "alquiler",
      descripcion: "",
      monto: "",
      fecha: new Date().toISOString().split('T')[0],
      metodo_pago: "efectivo",
      estado: "completado",
      notas: ""
    });
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  if (loading) return <div style={{padding: "2rem", color: "#fff"}}>Cargando...</div>;

  return (
    <div style={{padding: "1.5rem", background: "#0a0a0a", minHeight: "100vh"}}>
      <h1 style={{color: "#EB0463", marginBottom: "1.5rem"}}>💰 Finanzas</h1>

      {/* Selector de periodo */}
      <div style={{display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap"}}>
        <select value={mes} onChange={(e) => setMes(e.target.value)} style={{padding: "0.5rem", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}}>
          {Array.from({length: 12}, (_, i) => i + 1).map(m => (
            <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
          ))}
        </select>
        <select value={anio} onChange={(e) => setAnio(e.target.value)} style={{padding: "0.5rem", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}}>
          {[2024, 2025, 2026, 2027].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={{padding: "0.5rem", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={{padding: "0.5rem", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} />
        <button onClick={cargarDatos} style={{padding: "0.5rem 1rem", background: "#EB0463", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer"}}>Actualizar</button>
      </div>

      {/* Tabs */}
      <div style={{display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid #333"}}>
        <button onClick={() => setTabActiva("dashboard")} style={{padding: "0.75rem 1.5rem", background: tabActiva === "dashboard" ? "#EB0463" : "transparent", color: "#fff", border: "none", cursor: "pointer", borderBottom: tabActiva === "dashboard" ? "3px solid #EB0463" : "none"}}>
          Dashboard
        </button>
        <button onClick={() => setTabActiva("gastos")} style={{padding: "0.75rem 1.5rem", background: tabActiva === "gastos" ? "#EB0463" : "transparent", color: "#fff", border: "none", cursor: "pointer", borderBottom: tabActiva === "gastos" ? "3px solid #EB0463" : "none"}}>
          Gastos
        </button>
        <button onClick={() => setTabActiva("movimientos")} style={{padding: "0.75rem 1.5rem", background: tabActiva === "movimientos" ? "#EB0463" : "transparent", color: "#fff", border: "none", cursor: "pointer", borderBottom: tabActiva === "movimientos" ? "3px solid #EB0463" : "none"}}>
          Movimientos
        </button>
      </div>

      {/* TAB DASHBOARD */}
      {tabActiva === "dashboard" && dashboard && (
        <div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "2rem"}}>
            <div style={{background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", padding: "1.5rem", borderRadius: "8px"}}>
              <h3 style={{margin: 0, fontSize: "0.9rem", opacity: 0.9}}>Total Ingresos</h3>
              <p style={{fontSize: "1.8rem", fontWeight: "bold", margin: "0.5rem 0 0 0"}}>{formatMoney(dashboard.ingresos.total)}</p>
              <small style={{opacity: 0.8}}>Servicios: {formatMoney(dashboard.ingresos.servicios)}</small><br/>
              <small style={{opacity: 0.8}}>Productos: {formatMoney(dashboard.ingresos.productos)}</small>
            </div>
            <div style={{background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", padding: "1.5rem", borderRadius: "8px"}}>
              <h3 style={{margin: 0, fontSize: "0.9rem", opacity: 0.9}}>Total Gastos</h3>
              <p style={{fontSize: "1.8rem", fontWeight: "bold", margin: "0.5rem 0 0 0"}}>{formatMoney(dashboard.gastos.total)}</p>
              <small style={{opacity: 0.8}}>Manuales: {formatMoney(dashboard.gastos.manuales)}</small><br/>
              <small style={{opacity: 0.8}}>Comisiones: {formatMoney(dashboard.gastos.comisiones)}</small>
            </div>
            <div style={{background: dashboard.utilidadNeta >= 0 ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)", padding: "1.5rem", borderRadius: "8px"}}>
              <h3 style={{margin: 0, fontSize: "0.9rem", opacity: 0.9}}>Utilidad Neta</h3>
              <p style={{fontSize: "1.8rem", fontWeight: "bold", margin: "0.5rem 0 0 0"}}>{formatMoney(dashboard.utilidadNeta)}</p>
            </div>
          </div>

          {/* Gastos por categoría */}
          {dashboard.gastos.porCategoria.length > 0 && (
            <div style={{background: "#1a1a1a", padding: "1.5rem", borderRadius: "8px"}}>
              <h3 style={{color: "#fff", marginTop: 0}}>Gastos por Categoría</h3>
              {dashboard.gastos.porCategoria.map(cat => (
                <div key={cat.categoria} style={{display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #333"}}>
                  <span style={{color: "#fff"}}>{cat.categoria}</span>
                  <span style={{color: "#EB0463", fontWeight: "bold"}}>{formatMoney(cat.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB GASTOS */}
      {tabActiva === "gastos" && (
        <div>
          <button onClick={() => { setMostrarForm(!mostrarForm); setEditandoId(null); resetForm(); }} style={{padding: "0.75rem 1.5rem", background: "#43e97b", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", marginBottom: "1rem", fontWeight: "bold"}}>
            {mostrarForm ? "Cancelar" : "+ Nuevo Gasto"}
          </button>

          {/* Formulario */}
          {mostrarForm && (
            <form onSubmit={handleSubmit} style={{background: "#1a1a1a", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem"}}>
              <h3 style={{color: "#fff", marginTop: 0}}>{editandoId ? "Editar Gasto" : "Nuevo Gasto"}</h3>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem"}}>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Tipo</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required>
                    <option value="fijo">Fijo</option>
                    <option value="variable">Variable</option>
                    <option value="nomina">Nómina</option>
                    <option value="dotacion">Dotación</option>
                    <option value="prestamo">Préstamo</option>
                    <option value="compra">Compra Inventario</option>
                  </select>
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Categoría</label>
                  <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required>
                    <option value="alquiler">Alquiler</option>
                    <option value="servicios">Servicios (agua, luz, internet)</option>
                    <option value="salarios">Salarios</option>
                    <option value="comisiones">Comisiones</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="publicidad">Publicidad</option>
                    <option value="dotacion">Dotación</option>
                    <option value="prestamo">Préstamo</option>
                    <option value="productos">Productos</option>
                    <option value="insumos">Insumos</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Monto</label>
                  <input type="number" value={formData.monto} onChange={(e) => setFormData({...formData, monto: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required />
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Fecha</label>
                  <input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required />
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Método Pago</label>
                  <select value={formData.metodo_pago} onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}}>
                    <option value="completado">Completado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>
              <div style={{marginTop: "1rem"}}>
                <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Descripción</label>
                <input type="text" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required />
              </div>
              <div style={{marginTop: "1rem"}}>
                <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Notas</label>
                <textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px", minHeight: "60px"}} />
              </div>
              <button type="submit" style={{marginTop: "1rem", padding: "0.75rem 1.5rem", background: "#EB0463", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold"}}>
                {editandoId ? "Actualizar" : "Guardar"}
              </button>
            </form>
          )}

          {/* Tabla de gastos */}
          <div style={{overflowX: "auto"}}>
            <table style={{width: "100%", borderCollapse: "collapse", background: "#1a1a1a"}}>
              <thead>
                <tr style={{borderBottom: "2px solid #333"}}>
                  <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Fecha</th>
                  <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Tipo</th>
                  <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Categoría</th>
                  <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Descripción</th>
                  <th style={{padding: "1rem", textAlign: "right", color: "#fff"}}>Monto</th>
                  <th style={{padding: "1rem", textAlign: "center", color: "#fff"}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map(gasto => (
                  <tr key={gasto.id} style={{borderBottom: "1px solid #333"}}>
                    <td style={{padding: "1rem", color: "#fff"}}>{gasto.fecha}</td>
                    <td style={{padding: "1rem", color: "#fff"}}>{gasto.tipo}</td>
                    <td style={{padding: "1rem", color: "#fff"}}>{gasto.categoria}</td>
                    <td style={{padding: "1rem", color: "#fff"}}>{gasto.descripcion}</td>
                    <td style={{padding: "1rem", textAlign: "right", color: "#f5576c", fontWeight: "bold"}}>{formatMoney(gasto.monto)}</td>
                    <td style={{padding: "1rem", textAlign: "center"}}>
                      <button onClick={() => handleEditar(gasto)} style={{padding: "0.25rem 0.5rem", background: "#43e97b", color: "#000", border: "none", borderRadius: "3px", cursor: "pointer", marginRight: "0.5rem", fontSize: "10px"}}>Editar</button>
                      <button onClick={() => handleEliminar(gasto.id)} style={{padding: "0.25rem 0.5rem", background: "#f5576c", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "10px"}}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB MOVIMIENTOS */}
      {tabActiva === "movimientos" && (
        <div style={{overflowX: "auto"}}>
          <table style={{width: "100%", borderCollapse: "collapse", background: "#1a1a1a"}}>
            <thead>
              <tr style={{borderBottom: "2px solid #333"}}>
                <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Fecha</th>
                <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Tipo</th>
                <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Categoría</th>
                <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Descripción</th>
                <th style={{padding: "1rem", textAlign: "right", color: "#fff"}}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov, idx) => (
                <tr key={idx} style={{borderBottom: "1px solid #333"}}>
                  <td style={{padding: "1rem", color: "#fff"}}>{mov.fecha}</td>
                  <td style={{padding: "1rem", color: mov.tipo === 'ingreso' ? "#43e97b" : "#f5576c", fontWeight: "bold"}}>{mov.tipo}</td>
                  <td style={{padding: "1rem", color: "#fff"}}>{mov.categoria}</td>
                  <td style={{padding: "1rem", color: "#fff"}}>{mov.descripcion}</td>
                  <td style={{padding: "1rem", textAlign: "right", color: mov.tipo === 'ingreso' ? "#43e97b" : "#f5576c", fontWeight: "bold"}}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}{formatMoney(mov.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
