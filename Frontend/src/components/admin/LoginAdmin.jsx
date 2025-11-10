// src/components/Admin/LoginAdmin.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginAdmin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  // Si ya está autenticado, redirigir al panel
  useEffect(() => {
    if (localStorage.getItem("motobombon_is_admin") === "true") {
      nav("/admin", { replace: true });
    }
  }, [nav]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Credenciales simples (cambiar en producción)
    if (user === "admin" && pass === "motobombon123") {
      localStorage.setItem("motobombon_is_admin", "true");
      nav("/admin");
    } else {
      setErr("Usuario o contraseña incorrectos");
      setTimeout(() => setErr(""), 3000);
    }
  };

  return (
    <div className="centered-page">
      <div className="container" style={{ maxWidth: 560 }}>
        <h2>Login Administrador - MOTOBOMBON</h2>
        <form onSubmit={handleLogin} className="form-container" style={{ boxShadow: "none", padding: 0 }}>
          <input placeholder="Usuario" value={user} onChange={(e) => setUser(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} required />
          <button type="submit">Entrar</button>
          {err && <p style={{ color: "crimson" }}>{err}</p>}

          {/* Ayuda rápida si algo falla */}
          <div style={{ marginTop: 12 }}>
            <small style={{ color: "#6b7280" }}>
              Usuario: <b>admin</b> — Contraseña: <b>motobombon123</b>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
