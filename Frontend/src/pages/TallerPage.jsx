// Frontend/src/pages/TallerPage.jsx
import { useState, useEffect } from "react";
import { addCita, getCitas } from "../services/citasService";
import talleresService from "../services/talleresService";
import serviciosService from "../services/serviciosService";

export default function TallerPage() {
  const [talleres, setTalleres] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [motosEnEspera, setMotosEnEspera] = useState(0);
  
  
  const [form, setForm] = useState({
    taller_id: "",
    marca: "",
    modelo: "",
    cilindraje: "",
    servicio: "",
    comentarios: "",
    metodo_pago: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    loadTalleres();
    loadServicios();
    loadMotosEnEspera();
  }, []);

  const loadTalleres = async () => {
    try {
      const data = await talleresService.getTalleres();
      console.log("Talleres cargados:", data);
      if (data && data.length > 0) {
        setTalleres(data);
      } else {
        setTalleres([]);
        mostrarMensaje("⚠️ No hay talleres registrados aún. Contacta con administración.", "error");
      }
    } catch (error) {
      console.error("Error al cargar talleres:", error);
      setTalleres([]);
      mostrarMensaje("Error al cargar talleres: " + error.message, "error");
    }
  };

  const loadServicios = async () => {
    try {
      const data = await serviciosService.getServicios();
      setServicios(data);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    }
  };

  const loadMotosEnEspera = async () => {
    try {
      const todasLasCitas = await getCitas();
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const dd = String(hoy.getDate()).padStart(2, '0');
      const fechaHoy = `${yyyy}-${mm}-${dd}`;
      
      const citasHoy = todasLasCitas.filter(cita => 
        cita.fecha === fechaHoy && 
        ['pendiente', 'confirmada', 'en curso'].includes(cita.estado)
      );
      
      setMotosEnEspera(citasHoy.length);
    } catch (error) {
      console.error('Error al cargar motos en espera:', error);
      setMotosEnEspera(0);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 5000);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleServicioSelect = (nombre) => {
    setForm({ ...form, servicio: nombre });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!accessToken) {
      mostrarMensaje("Acceso no autorizado. Usa el QR de taller.", "error");
      setLoading(false);
      return;
    }

    // Validaciones
    if (!form.taller_id) {
      mostrarMensaje("Selecciona un taller", "error");
      setLoading(false);
      return;
    }

    const ccNumber = parseInt(form.cilindraje);
    const cilindrajeValido = !isNaN(ccNumber) && ccNumber >= 50 && ccNumber <= 2000;
    if (!cilindrajeValido) {
      mostrarMensaje("Por favor ingresa un cilindraje válido (50 - 2000 cc)", "error");
      setLoading(false);
      return;
    }

    if (!form.servicio) {
      mostrarMensaje("Selecciona un servicio", "error");
      setLoading(false);
      return;
    }

    if (!form.metodo_pago) {
      mostrarMensaje("Selecciona un método de pago", "error");
      setLoading(false);
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
      const hh = String(hoy.getHours()).padStart(2, '0');
      const mi = String(hoy.getMinutes()).padStart(2, '0');
    
    // Obtener datos del taller
    const tallerSeleccionado = talleres.find(t => t.id === parseInt(form.taller_id));

    const citaData = {
      cliente: tallerSeleccionado?.nombre || "Taller Aliado",
      telefono: tallerSeleccionado?.telefono || "",
      email: tallerSeleccionado?.email || "",
      placa: `TALLER-${Date.now()}`, // ID único para taller
      marca: form.marca,
      modelo: form.modelo,
      cilindraje: form.cilindraje,
      servicio: form.servicio,
      metodo_pago: form.metodo_pago,
      comentarios: form.comentarios,
      fecha: `${yyyy}-${mm}-${dd}`,
      hora: `${hh}:${mi}`,
      tipo_cliente: "taller", // IMPORTANTE: marcar como taller
      taller_id: form.taller_id
    };

    try {
      await addCita(citaData, accessToken);
      
      mostrarMensaje("🎉 ¡Moto ingresada al sistema! Gracias por confiar en MOTOBOMBON 🏍️✨", "success");
      
      setForm({
        taller_id: "",
        marca: "",
        modelo: "",
        cilindraje: "",
        servicio: "",
        comentarios: "",
        metodo_pago: "",
      });
      
      loadMotosEnEspera();
    } catch (error) {
      mostrarMensaje(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (talleres.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "40px",
          maxWidth: "500px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🏢</div>
          <h2 style={{ fontSize: "24px", color: "#333", marginBottom: "10px" }}>Portal de Talleres</h2>
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px", lineHeight: "1.6" }}>
            ⚠️ No hay talleres registrados aún en el sistema.
          </p>
          <p style={{ fontSize: "14px", color: "#999", marginBottom: "20px" }}>
            Contacta con la administración de MOTOBOMBON para registrar tu taller.
          </p>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #EB0463 0%, #a65495 100%)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {mensaje.texto && (
          <div className={`notificacion ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}
        
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          textAlign: "center"
        }}>
          <h1 style={{ fontSize: "28px", margin: "0 0 10px 0", color: "#333" }}>
            🏢 Portal de Talleres Aliados
          </h1>
          <p style={{ color: "#666", margin: "0" }}>
            Ingresa las motos para servicio
          </p>
        </div>

        {motosEnEspera > 0 && (
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '2px solid #F59E0B',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏍️</div>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400E', marginBottom: '4px' }}>
              {motosEnEspera} {motosEnEspera === 1 ? 'moto' : 'motos'} en espera
            </p>
            <p style={{ fontSize: '14px', color: '#78350F' }}>
              {motosEnEspera === 1 ? 'Hay 1 moto antes de las nuevas' : `Hay ${motosEnEspera} motos antes de las nuevas`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
              🏢 Selecciona tu Taller
            </label>
            <select
              name="taller_id"
              value={form.taller_id}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #EB0463",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit"
              }}
            >
              <option value="">-- Selecciona un taller --</option>
              {talleres.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.contacto ? `(${t.contacto})` : ''}
                </option>
              ))}
            </select>
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "12px" }}>
            🏍️ Datos de la Moto
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              name="marca"
              placeholder="Marca (ej: Yamaha, Honda)"
              value={form.marca}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              name="modelo"
              placeholder="Modelo (ej: FZ-16, CBR 600)"
              value={form.modelo}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <input
              type="number"
              name="cilindraje"
              placeholder="Cilindraje en CC (ej: 150, 600)"
              value={form.cilindraje}
              onChange={handleChange}
              min="50"
              max="2000"
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "12px" }}>
            💰 Método de Pago
          </h3>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {['codigo_qr', 'efectivo'].map(metodo => (
              <label key={metodo} style={{
                flex: 1,
                padding: "10px",
                border: `2px solid ${form.metodo_pago === metodo ? '#EB0463' : '#ddd'}`,
                borderRadius: "6px",
                cursor: "pointer",
                background: form.metodo_pago === metodo ? '#fff0f6' : 'white',
                transition: "all 0.3s"
              }}>
                <input
                  type="radio"
                  name="metodo_pago"
                  value={metodo}
                  checked={form.metodo_pago === metodo}
                  onChange={handleChange}
                  style={{ marginRight: "6px" }}
                />
                <span style={{ fontWeight: "500" }}>
                  {metodo === 'codigo_qr' ? '📲 Código QR' : '💵 Efectivo'}
                </span>
              </label>
            ))}
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "12px" }}>
            🔧 Selecciona Servicio
          </h3>

          {servicios.length === 0 ? (
            <p style={{ color: "#999" }}>Cargando servicios...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              {servicios.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleServicioSelect(s.nombre)}
                  style={{
                    padding: "12px",
                    border: `2px solid ${form.servicio === s.nombre ? '#EB0463' : '#ddd'}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: form.servicio === s.nombre ? '#fff0f6' : 'white',
                    textAlign: "center",
                    transition: "all 0.3s"
                  }}
                >
                  <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px" }}>
                    {s.nombre}
                  </p>
                  <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                    {s.duracion} min
                  </p>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <textarea
              name="comentarios"
              placeholder="Comentarios adicionales (opcional)"
              value={form.comentarios}
              onChange={handleChange}
              rows="3"
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#ccc" : "linear-gradient(135deg, #EB0463 0%, #a65495 100%)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s"
            }}
          >
            {loading ? "Ingresando..." : "✅ Ingresar Moto al Sistema"}
          </button>
        </form>
      </div>

      <style>{`
        .notificacion {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 600;
          text-align: center;
        }

        .notificacion.success {
          background: #d1fae5;
          color: #065f46;
          border: 2px solid #10b981;
        }

        .notificacion.error {
          background: #fee2e2;
          color: #991b1b;
          border: 2px solid #f87171;
        }
      `}</style>
    </div>
  );
}
