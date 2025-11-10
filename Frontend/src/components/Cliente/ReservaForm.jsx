import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import { addCita, getCitas } from "../../services/citasService";
import serviciosService from "../../services/serviciosService";

export default function ReservaForm() {
  const [form, setForm] = useState({
    cliente: "",
    telefono: "",
    email: "",
    placa: "",
    marca: "",
    modelo: "",
    cilindraje: "",
    servicio: "",
    fechaHora: null,
    comentarios: "",
  });
  
  const [servicios, setServicios] = useState([]);
  const [bloquesOcupados, setBloquesOcupados] = useState([]); // [{inicio: min, fin: min}]
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const loadServicios = async () => {
    try {
      const data = await serviciosService.getServicios();
      setServicios(data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      // Fallback a servicios por defecto si hay error
      const fallbackServicios = [
        { id: 1, nombre: "Lavado Básico", precio: 15000, duracion: 30, descripcion: "Lavado exterior completo", img: "/img/lavado-basico.jpg" },
        { id: 2, nombre: "Lavado Premium", precio: 25000, duracion: 60, descripcion: "Lavado + encerado y brillo", img: "/img/lavado-premium.jpg" },
        { id: 3, nombre: "Lavado Detallado", precio: 40000, duracion: 90, descripcion: "Lavado completo + motor + protección", img: "/img/lavado-detallado.jpg" },
      ];
      setServicios(fallbackServicios);
    }
  };

  // Cargar servicios al montar el componente
  useEffect(() => {
    loadServicios();
  }, []);

  // Mostrar loading mientras cargan los servicios
  if (servicios.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-center mb-4">🔄 Cargando formulario...</h2>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a65495] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando servicios disponibles...</p>
        </div>
      </div>
    );
  }

  const cargarBloquesOcupados = async (fecha) => {
    if (!fecha) return;
    
    try {
      const fechaStr = fecha.toISOString().split("T")[0];
      const todas = await getCitas();
      // Mapa de duración por servicio
      const mapDuracion = new Map(servicios.map(s => [s.nombre, Number(s.duracion || 60)]));
      const delDia = (todas || []).filter(c => c.fecha === fechaStr && c.estado !== 'cancelada');
      const toMin = (hhmm) => {
        const [h, m] = hhmm.split(":").map(n => parseInt(n, 10));
        return h * 60 + m;
      };
      const bloques = delDia.map(c => {
        const inicio = toMin(c.hora);
        const dur = mapDuracion.get(c.servicio) || 60;
        return { inicio, fin: inicio + dur };
      });
      setBloquesOcupados(bloques);
    } catch (error) {
      console.error("Error al cargar bloques ocupados:", error);
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
    // Si ya hay fecha seleccionada, recargar bloques para ese día
    if (form.fechaHora) cargarBloquesOcupados(form.fechaHora);
  };

  const handleFechaChange = (fecha) => {
    setForm({ ...form, fechaHora: fecha });
    cargarBloquesOcupados(fecha);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones básicas
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

    if (!form.fechaHora) {
      mostrarMensaje("Por favor selecciona fecha y hora", "error");
      setLoading(false);
      return;
    }

    // Formato correcto de hora HH:MM (24 horas)
    const hours = form.fechaHora.getHours().toString().padStart(2, '0');
    const minutes = form.fechaHora.getMinutes().toString().padStart(2, '0');

    const citaData = {
      ...form,
      fecha: form.fechaHora.toISOString().split("T")[0],
      hora: `${hours}:${minutes}`,
    };

    try {
      await addCita(citaData);
      
      mostrarMensaje("🎉 ¡Cita reservada con éxito! Te esperamos en MOTOBOMBON 🏍️✨", "success");
      
      setForm({
        cliente: "",
        telefono: "",
        email: "",
        placa: "",
        marca: "",
        modelo: "",
        cilindraje: "",
        servicio: "",
        fechaHora: null,
        comentarios: "",
      });
      setBloquesOcupados([]);
      
    } catch (error) {
      mostrarMensaje(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const horasDisponibles = (time) => {
    // Requiere seleccionar servicio para evaluar duración
    const servicioSel = servicios.find(s => s.nombre === form.servicio);
    const dur = servicioSel ? Number(servicioSel.duracion || 60) : 60;
    const date = new Date(time);
    const inicio = date.getHours() * 60 + date.getMinutes();
    const fin = inicio + dur;
    const enHorario = inicio >= 8 * 60 && fin <= 18 * 60; // 8:00 a 18:00
    const solapa = bloquesOcupados.some(b => inicio < b.fin && fin > b.inicio);
    return enHorario && !solapa;
  };

  return (
    <div>
      {mensaje.texto && (
        <div className={`notificacion ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}
      
      {/* Estado de carga para servicios */}
      {servicios.length === 0 && (
        <div className="text-center py-8">
          <div className="spinner border-4 border-[#a65495] border-t-transparent rounded-full w-8 h-8 mx-auto animate-spin"></div>
          <p className="mt-2 text-gray-600">Cargando servicios...</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="form-container">
        <input
          type="text"
          name="cliente"
          placeholder="Tu nombre completo"
          value={form.cliente}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="telefono"
          placeholder="Teléfono o WhatsApp"
          value={form.telefono}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          required
        />

        <h3>🏍️ Datos de tu moto</h3>
        
        <input
          type="text"
          name="placa"
          placeholder="Placa (ej: ABC123)"
          value={form.placa}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="marca"
          placeholder="Marca (ej: Yamaha, Honda, Suzuki)"
          value={form.marca}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="modelo"
          placeholder="Modelo (ej: FZ-16, CBR 600)"
          value={form.modelo}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="cilindraje"
          placeholder="Cilindraje en CC (ej: 150, 600, 1000)"
          value={form.cilindraje}
          onChange={handleChange}
          min="50"
          max="2000"
          required
        />

        <h3>Selecciona tu servicio</h3>
        {(() => {
          const ccNumber = parseInt(form.cilindraje);
          const cilindrajeValido = !isNaN(ccNumber) && ccNumber >= 50 && ccNumber <= 2000;
          if (!cilindrajeValido) {
            return (
              <p className="aviso-cilindraje" style={{marginBottom: '16px', fontSize: '14px'}}>
                Ingresa el <strong>cilindraje</strong> válido (50 - 2000 cc) para ver y seleccionar los servicios.
              </p>
            );
          }
          return (
            <div className="servicios-grid">
              {servicios.map((s) => {
                // Determinar precio según cilindraje
                const cc = ccNumber || 0;
                const esBajoCC = cc >= 100 && cc <= 405;
                const esAltoCC = cc > 405 && cc <= 1200;
                let precioMostrar = s.precio;
                
                if (form.cilindraje && s.precio_bajo_cc && s.precio_alto_cc) {
                  if (esBajoCC) {
                    precioMostrar = s.precio_bajo_cc;
                  } else if (esAltoCC) {
                    precioMostrar = s.precio_alto_cc;
                  }
                }
                
                return (
                  <div
                    key={s.id || s.nombre}
                    className={`servicio-card ${
                      form.servicio === s.nombre ? "selected" : ""
                    }`}
                    onClick={() => handleServicioSelect(s.nombre)}
                  >
                    <img src={s.imagen || s.img || "/img/default.jpg"} alt={s.nombre} />
                    <div className="servicio-info">
                      <p className="servicio-nombre">{s.nombre}</p>
                      {precioMostrar && (
                        <p className="servicio-precio">${precioMostrar}</p>
                      )}
                      {form.cilindraje && s.precio_bajo_cc && s.precio_alto_cc && (
                        <p className="text-xs text-gray-500">
                          {esBajoCC ? '(Bajo CC)' : esAltoCC ? '(Alto CC)' : ''}
                        </p>
                      )}
                      {s.descripcion && (
                        <p className="servicio-descripcion">{s.descripcion}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <h3>Selecciona fecha y hora</h3>
        {form.fechaHora && bloquesOcupados.length > 0 && (
          <div className="horarios-info">
            <p className="text-sm text-gray-600">⚠️ Hay citas ocupando bloques en esta fecha</p>
          </div>
        )}
        
        <DatePicker
          selected={form.fechaHora}
          onChange={handleFechaChange}
          showTimeSelect
          timeIntervals={30}
          minDate={new Date()}
          filterTime={horasDisponibles}
          dateFormat="dd/MM/yyyy h:mm aa"
          locale={es}
          placeholderText="Selecciona fecha y hora"
          className="input-fecha"
        />

        <textarea
          name="comentarios"
          placeholder="Comentarios adicionales"
          value={form.comentarios}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Reservando..." : "Reservar cita"}
        </button>
      </form>
    </div>
  );
}
