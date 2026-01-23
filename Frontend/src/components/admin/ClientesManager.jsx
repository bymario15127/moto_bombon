// Frontend/src/components/admin/ClientesManager.jsx
import { useState, useEffect } from "react";
import { getClientes, verificarCupon, usarCupon, exportarClientesExcel } from "../../services/clientesService";
import "../../App.css";

export default function ClientesManager() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("lavadas");
  const [mostrarCupon, setMostrarCupon] = useState(false);
  const [codigoCupon, setCodigoCupon] = useState("");
  const [resultadoCupon, setResultadoCupon] = useState(null);
  const [mostrarFusionar, setMostrarFusionar] = useState(false);
  const [emailPrincipal, setEmailPrincipal] = useState("");
  const [emailDuplicado, setEmailDuplicado] = useState("");

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
      <div style={{ padding: "2rem", textAlign: "center", color: "#00d4ff" }}>
        <p>⏳ Cargando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "#ff6b6b" }}>❌ Error: {error}</p>
        <ActionButton label="🔄 Reintentar" color="#667eea" onClick={cargarClientes} />
      </div>
    );
  }

  return (
    <div style={{
      padding: "1rem",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{
          marginBottom: "2rem",
          color: "#00d4ff",
          fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
          textShadow: "0 0 10px rgba(0,212,255,0.3)"
        }}>
          🎁 Gestión de Clientes y Fidelización
        </h1>

        {/* Estadísticas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          <StatCard titulo="Total Clientes" valor={clientes.length} gradiente="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" icono="👥" />
          <StatCard titulo="Total Lavadas (Histórico)" valor={clientes.reduce((sum, c) => sum + (c.total_lavadas_historico || c.lavadas_completadas), 0)} gradiente="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" icono="🚗" />
          <StatCard titulo="Cupones Disponibles" valor={clientes.reduce((sum, c) => sum + c.lavadas_gratis_pendientes, 0)} gradiente="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" icono="🎫" />
          <StatCard titulo="Clientes VIP (10+)" valor={clientes.filter((c) => c.lavadas_completadas >= 10).length} gradiente="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" icono="⭐" />
        </div>

        {/* Controles */}
        <div style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              flex: "1 1 100%",
              minWidth: "200px",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "2px solid #00d4ff",
              background: "#0f1419",
              color: "#fff",
              fontSize: "1rem"
            }}
          />

          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            style={{
              flex: "1 1 100%",
              minWidth: "200px",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "2px solid #00d4ff",
              background: "#0f1419",
              color: "#fff",
              fontSize: "1rem"
            }}
          >
            <option value="lavadas">Ordenar por Lavadas</option>
            <option value="nombre">Ordenar por Nombre</option>
          </select>

          <ActionButton label="🔗 Fusionar" color="#ff6b6b" onClick={() => setMostrarFusionar(!mostrarFusionar)} />
          <ActionButton label="🎫 Cupón" color="#667eea" onClick={() => setMostrarCupon(!mostrarCupon)} />
          <ActionButton label="� Exportar Excel" color="#ffa500" onClick={() => exportarClientesExcel(clientes).catch(err => alert(err.message))} />
          <ActionButton label="�🔄 Actualizar" color="#43e97b" onClick={cargarClientes} />
        </div>

        {/* Panel Fusionar */}
        {mostrarFusionar && (
          <div style={{
            background: "linear-gradient(135deg, #ff6b6b 0%, #ff8c42 100%)",
            borderRadius: "15px",
            padding: "clamp(1rem, 3vw, 2rem)",
            marginBottom: "2rem",
            boxShadow: "0 8px 32px rgba(255,107,107,0.3)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ marginTop: 0, color: "white", fontSize: "clamp(1.2rem, 3vw, 1.5rem)" }}>🔗 Fusionar Clientes Duplicados</h3>
            <p style={{ color: "rgba(255,255,255,0.9)" }}>Combina dos registros. Las lavadas se sumarán y cupones se transferirán.</p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem"
            }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "white" }}>Email Principal:</label>
                <select value={emailPrincipal} onChange={(e) => setEmailPrincipal(e.target.value)} style={{
                  width: "100%", padding: "0.75rem", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "1rem"
                }}>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => (<option key={c.email} value={c.email}>{c.email} ({c.total_lavadas_historico || c.lavadas_completadas})</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "white" }}>Email Duplicado:</label>
                <select value={emailDuplicado} onChange={(e) => setEmailDuplicado(e.target.value)} style={{
                  width: "100%", padding: "0.75rem", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "1rem"
                }}>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => (<option key={c.email} value={c.email}>{c.email} ({c.total_lavadas_historico || c.lavadas_completadas})</option>))}
                </select>
              </div>
            </div>

            <button onClick={async () => {
              if (!emailPrincipal || !emailDuplicado) { alert("Selecciona ambos emails"); return; }
              if (emailPrincipal === emailDuplicado) { alert("Emails deben ser diferentes"); return; }
              if (!confirm(`¿Fusionar ${emailDuplicado} en ${emailPrincipal}?`)) return;
              try {
                const response = await fetch("/api/clientes/fusionar", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ emailPrincipal, emailDuplicado })
                });
                const data = await response.json();
                if (response.ok) {
                  alert(`✅ Fusionado!\n${data.mensaje}`);
                  setMostrarFusionar(false);
                  setEmailPrincipal("");
                  setEmailDuplicado("");
                  cargarClientes();
                } else {
                  alert("❌ " + data.error);
                }
              } catch (err) {
                alert("Error: " + err.message);
              }
            }} style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "clamp(0.9rem, 2vw, 1rem)"
            }}>
              ✅ Fusionar Ahora
            </button>
          </div>
        )}

        {/* Panel Cupón */}
        {mostrarCupon && (
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "15px",
            padding: "clamp(1rem, 3vw, 2rem)",
            marginBottom: "2rem",
            boxShadow: "0 8px 32px rgba(102,126,234,0.3)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ marginTop: 0, color: "white", fontSize: "clamp(1.2rem, 3vw, 1.5rem)" }}>🎫 Verificar Cupón</h3>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem"
            }}>
              <input
                type="text"
                placeholder="Ingresa código de cupón"
                value={codigoCupon}
                onChange={(e) => setCodigoCupon(e.target.value)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "1rem"
                }}
              />
              <ActionButton label="🔍 Verificar" color="#43e97b" onClick={verificarCuponHandler} />
              <ActionButton label="✅ Usar Cupón" color="#4facfe" onClick={usarCuponHandler} />
            </div>

            {resultadoCupon && (
              <div style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "1rem",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white"
              }}>
                <p><strong>Email:</strong> {resultadoCupon.email}</p>
                <p><strong>Estado:</strong> {resultadoCupon.usado ? "✅ Usado" : "🔄 Disponible"}</p>
                {resultadoCupon.usado && <p><strong>Usado en:</strong> {new Date(resultadoCupon.fecha_uso).toLocaleString()}</p>}
              </div>
            )}
          </div>
        )}

        {/* Lista Clientes */}
        {clientesFiltrados.length > 0 ? (
          <div style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))"
          }}>
            {clientesFiltrados.map((cliente) => (
              <div key={cliente.email} style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "1px solid #00d4ff",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
              }}>
                <h4 style={{ marginTop: 0, color: "#00d4ff", fontSize: "clamp(1rem, 2vw, 1.3rem)" }}>{cliente.nombre}</h4>
                <p style={{ color: "#aaa", margin: "0.5rem 0", fontSize: "0.9rem" }}>📧 {cliente.email}</p>
                {cliente.telefono && <p style={{ color: "#aaa", margin: "0.5rem 0", fontSize: "0.9rem" }}>📱 {cliente.telefono}</p>}

                <div style={{ margin: "1rem 0", padding: "1rem", background: "rgba(0,212,255,0.1)", borderRadius: "8px", border: "1px solid rgba(0,212,255,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "#00d4ff" }}>
                    <span>Ciclo Actual: {cliente.lavadas_completadas}/10</span>
                    <span>{10 - cliente.lavadas_completadas} para próximo</span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(cliente.lavadas_completadas / 10) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #00d4ff 0%, #667eea 100%)",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  fontSize: "0.9rem"
                }}>
                  <div style={{ background: "rgba(240,147,251,0.2)", padding: "0.5rem", borderRadius: "6px", textAlign: "center", color: "#f093fb" }}>
                    <strong>{cliente.total_lavadas_historico || cliente.lavadas_completadas}</strong><br />Total
                  </div>
                  <div style={{ background: "rgba(79,172,254,0.2)", padding: "0.5rem", borderRadius: "6px", textAlign: "center", color: "#4facfe" }}>
                    <strong>{cliente.lavadas_gratis_pendientes || 0}</strong><br />Cupones
                  </div>
                </div>

                {/* Cupones disponibles */}
                {cliente.cupones?.filter(c => !c.usado).length > 0 && (
                  <div style={{
                    marginTop: "1rem",
                    padding: "0.75rem",
                    background: "rgba(67,226,123,0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(67,226,123,0.3)"
                  }}>
                    <p style={{ color: "#43e97b", fontWeight: "bold", margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>
                      🎫 Cupones Disponibles:
                    </p>
                    {cliente.cupones.filter(c => !c.usado).map(cupon => (
                      <div key={cupon.codigo} style={{
                        background: "rgba(0,212,255,0.2)",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        marginBottom: "0.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <code style={{
                          color: "#00d4ff",
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                          userSelect: "all"
                        }}>
                          {cupon.codigo}
                        </code>
                        <span style={{ color: "#aaa", fontSize: "0.75rem" }}>
                          {new Date(cupon.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            color: "#999",
            fontSize: "1.1rem"
          }}>
            ❌ No se encontraron clientes
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ titulo, valor, gradiente, icono }) {
  return (
    <div style={{
      background: gradiente,
      color: "white",
      padding: "clamp(1rem, 3vw, 2rem)",
      borderRadius: "15px",
      textAlign: "center",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      transition: "transform 0.3s ease",
      cursor: "pointer",
      border: "1px solid rgba(255,255,255,0.1)"
    }}
    onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
    onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{icono}</div>
      <div style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: "bold", margin: "0.5rem 0" }}>{valor}</div>
      <div style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", opacity: 0.9 }}>{titulo}</div>
    </div>
  );
}

function ActionButton({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: "1 1 auto",
      minWidth: "100px",
      padding: "0.75rem 1rem",
      background: color,
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "clamp(0.85rem, 2vw, 1rem)",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
    }}
    >
      {label}
    </button>
  );
}
