// Frontend/src/components/admin/ClientesManager.jsx
import { useState, useEffect } from "react";
import { getClientes, verificarCupon, usarCupon } from "../../services/clientesService";
import "../../App.css";

export default function ClientesManager() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("lavadas"); // lavadas | nombre
  const [mostrarCupon, setMostrarCupon] = useState(false);
  const [codigoCupon, setCodigoCupon] = useState("");
  const [resultadoCupon, setResultadoCupon] = useState(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarCuponHandler = async () => {
    if (!codigoCupon.trim()) {
      alert("Por favor ingresa un código de cupón");
      return;
    }

    try {
      const resultado = await verificarCupon(codigoCupon.trim());
      setResultadoCupon(resultado);
    } catch (err) {
      alert("Error al verificar cupón: " + err.message);
    }
  };

  const usarCuponHandler = async () => {
    if (!codigoCupon.trim()) {
      alert("Por favor ingresa un código de cupón");
      return;
    }

    if (!confirm("¿Estás seguro de marcar este cupón como usado?")) {
      return;
    }

    try {
      await usarCupon(codigoCupon.trim());
      alert("✅ Cupón usado exitosamente");
      setCodigoCupon("");
      setResultadoCupon(null);
      setMostrarCupon(false);
    } catch (err) {
      alert("Error al usar cupón: " + err.message);
    }
  };

  // Filtrar y ordenar clientes
  const clientesFiltrados = clientes
    .filter((cliente) => {
      const searchLower = busqueda.toLowerCase();
      return (
        cliente.nombre.toLowerCase().includes(searchLower) ||
        cliente.email.toLowerCase().includes(searchLower) ||
        (cliente.telefono && cliente.telefono.includes(busqueda))
      );
    })
    .sort((a, b) => {
      if (ordenarPor === "lavadas") {
        return b.lavadas_completadas - a.lavadas_completadas;
      } else {
        return a.nombre.localeCompare(b.nombre);
      }
    });

  if (loading) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        <p>Cargando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <button onClick={cargarClientes}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "2rem", maxWidth: "1200px" }}>
      <h1 style={{ marginBottom: "2rem", color: "#667eea" }}>
        🎁 Gestión de Clientes y Fidelización
      </h1>

      {/* Estadísticas Generales */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "1.5rem",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
            {clientes.length}
          </div>
          <div>Total Clientes</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            padding: "1.5rem",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
            {clientes.reduce((sum, c) => sum + (c.total_lavadas_historico || c.lavadas_completadas), 0)}
          </div>
          <div>Total Lavadas (Histórico)</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            padding: "1.5rem",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
            {clientes.reduce((sum, c) => sum + c.lavadas_gratis_pendientes, 0)}
          </div>
          <div>Cupones Disponibles</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            color: "white",
            padding: "1.5rem",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
            {clientes.filter((c) => c.lavadas_completadas >= 10).length}
          </div>
          <div>Clientes VIP (10+)</div>
        </div>
      </div>

      {/* Controles */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, email o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: 1,
            minWidth: "250px",
            padding: "0.75rem",
            borderRadius: "5px",
            border: "1px solid #ddd",
          }}
        />

        <select
          value={ordenarPor}
          onChange={(e) => setOrdenarPor(e.target.value)}
          style={{
            padding: "0.75rem",
            borderRadius: "5px",
            border: "1px solid #ddd",
          }}
        >
          <option value="lavadas">Ordenar por Lavadas</option>
          <option value="nombre">Ordenar por Nombre</option>
        </select>

        <button
          onClick={() => setMostrarCupon(!mostrarCupon)}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          🎫 Verificar Cupón
        </button>

        <button
          onClick={cargarClientes}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#43e97b",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Panel de Verificación de Cupón */}
      {mostrarCupon && (
        <div
          style={{
            background: "#f9f9f9",
            padding: "1.5rem",
            borderRadius: "10px",
            marginBottom: "2rem",
            border: "2px solid #667eea",
          }}
        >
          <h3 style={{ marginBottom: "1rem" }}>🎫 Verificar/Usar Cupón</h3>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Código del cupón (ej: GRATIS-xxx-xxx)"
              value={codigoCupon}
              onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontFamily: "monospace",
                fontSize: "1rem",
              }}
            />
            <button
              onClick={verificarCuponHandler}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#4facfe",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Verificar
            </button>
            <button
              onClick={usarCuponHandler}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#f5576c",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Usar Cupón
            </button>
          </div>

          {resultadoCupon && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "5px",
                background: resultadoCupon.valido ? "#d4edda" : "#f8d7da",
                color: resultadoCupon.valido ? "#155724" : "#721c24",
                border: `1px solid ${resultadoCupon.valido ? "#c3e6cb" : "#f5c6cb"}`,
              }}
            >
              <strong>
                {resultadoCupon.valido ? "✅ Cupón Válido" : "❌ Cupón Inválido"}
              </strong>
              <p style={{ margin: "0.5rem 0 0 0" }}>{resultadoCupon.mensaje}</p>
              {resultadoCupon.email_cliente && (
                <p style={{ margin: "0.5rem 0 0 0" }}>
                  Cliente: {resultadoCupon.email_cliente}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de Clientes */}
      <div style={{ marginBottom: "1rem", color: "#666" }}>
        Mostrando {clientesFiltrados.length} de {clientes.length} clientes
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {clientesFiltrados.map((cliente) => {
          const progreso = cliente.lavadas_completadas % 10;
          const porcentaje = (progreso / 10) * 100;
          const faltanParaGratis = 10 - progreso;

          return (
            <div
              key={cliente.id}
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                border: cliente.lavadas_gratis_pendientes > 0
                  ? "2px solid #43e97b"
                  : "1px solid #e0e0e0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                {/* Información del Cliente */}
                <div style={{ flex: "1", minWidth: "250px" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>
                    {cliente.nombre}
                    {cliente.lavadas_completadas >= 10 && (
                      <span style={{ marginLeft: "0.5rem", fontSize: "1.2rem" }}>
                        ⭐
                      </span>
                    )}
                  </h3>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    <div>📧 {cliente.email}</div>
                    {cliente.telefono && <div>📱 {cliente.telefono}</div>}
                    <div style={{ marginTop: "0.5rem", color: "#999", fontSize: "0.8rem" }}>
                      Cliente desde: {new Date(cliente.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div
                  style={{
                    display: "flex",
                    gap: "2rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color: "#667eea",
                      }}
                    >
                      {cliente.lavadas_completadas}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                      Ciclo Actual
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color: "#764ba2",
                      }}
                    >
                      {cliente.total_lavadas_historico || cliente.lavadas_completadas}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                      Total Histórico
                    </div>
                  </div>

                  {cliente.lavadas_gratis_pendientes > 0 && (
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "#43e97b",
                        }}
                      >
                        {cliente.lavadas_gratis_pendientes}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#666" }}>
                        🎁 Cupones Disponibles
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Progreso */}
              <div style={{ marginTop: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    color: "#666",
                  }}
                >
                  <span>
                    Progreso hacia próxima lavada gratis: {progreso}/10
                  </span>
                  <span style={{ color: "#667eea", fontWeight: "bold" }}>
                    {faltanParaGratis === 0
                      ? "¡Listo para cupón!"
                      : `Faltan ${faltanParaGratis}`}
                  </span>
                </div>
                <div
                  style={{
                    height: "10px",
                    background: "#e0e0e0",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                      width: `${porcentaje}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {clientesFiltrados.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "#999",
          }}
        >
          No se encontraron clientes con esos criterios de búsqueda
        </div>
      )}
    </div>
  );
}
