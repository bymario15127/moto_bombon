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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setErr("");
      
      console.log("🔑 Intentando login con:", user);
      
      // Hacer petición al backend para obtener token real
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
      });

      console.log("📡 Respuesta del servidor:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Error del servidor:", error);
        throw new Error(error.error || "Error al autenticar");
      }

      const data = await response.json();
      console.log("✅ Login exitoso, datos recibidos:", data);
      
      // Guardar token y datos en localStorage
      console.log("💾 Guardando token:", data.token);
      localStorage.setItem("motobombon_token", data.token);
      localStorage.setItem("motobombon_is_admin", "true");
      localStorage.setItem("motobombon_user_role", data.user.role);
      localStorage.setItem("motobombon_user_name", data.user.name);
      
      console.log("✅ Token guardado en localStorage");
      nav("/admin");
    } catch (error) {
      console.error("❌ Error en login:", error);
      setErr(error.message || "Error al autenticar");
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
        </form>
      </div>
    </div>
  );
}
