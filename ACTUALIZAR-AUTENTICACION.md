# 🔐 ACTUALIZACIÓN DEL FRONTEND PARA AUTENTICACIÓN SEGURA

## Cambios Necesarios en LoginAdmin.jsx

### ANTES (Inseguro - Contraseñas en texto plano):
```jsx
const handleLogin = (e) => {
  e.preventDefault();
  const users = {
    admin: { password: "motobombon123", role: "admin" },
    supervisor: { password: "supervisor123", role: "supervisor" }
  };
  // ❌ INSEGURO
}
```

### DESPUÉS (Seguro - JWT + bcrypt):

Reemplaza el archivo completo `Frontend/src/components/admin/LoginAdmin.jsx`:

```jsx
// src/components/Admin/LoginAdmin.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function LoginAdmin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  // Si ya está autenticado, redirigir al panel
  useEffect(() => {
    const token = localStorage.getItem("motobombon_token");
    if (token) {
      // Verificar si el token es válido
      fetch(\`\${API_URL}/auth/verify\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          nav("/admin", { replace: true });
        } else {
          localStorage.clear();
        }
      })
      .catch(() => localStorage.clear());
    }
  }, [nav]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    
    try {
      const response = await fetch(\`\${API_URL}/auth/login\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: user,
          password: pass
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErr(data.error || "Error al iniciar sesión");
        setTimeout(() => setErr(""), 3000);
        setLoading(false);
        return;
      }
      
      // Guardar token y datos de usuario
      localStorage.setItem("motobombon_token", data.token);
      localStorage.setItem("motobombon_is_admin", "true");
      localStorage.setItem("motobombon_user_role", data.user.role);
      localStorage.setItem("motobombon_user_name", data.user.name);
      
      nav("/admin");
      
    } catch (error) {
      console.error("Error en login:", error);
      setErr("Error de conexión con el servidor");
      setTimeout(() => setErr(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-page">
      <div className="container" style={{ maxWidth: 560 }}>
        <h2>Login Administrador - MOTOBOMBON</h2>
        <form onSubmit={handleLogin} className="form-container" style={{ boxShadow: "none", padding: 0 }}>
          <input 
            placeholder="Usuario" 
            value={user} 
            onChange={(e) => setUser(e.target.value)} 
            required 
            disabled={loading}
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={pass} 
            onChange={(e) => setPass(e.target.value)} 
            required 
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
          {err && <p style={{ color: "crimson", marginTop: 10 }}>{err}</p>}
        </form>
      </div>
    </div>
  );
}
```

---

## Crear Servicio de Autenticación (Opcional pero recomendado)

Crea `Frontend/src/services/authService.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const authService = {
  // Login
  async login(username, password) {
    const response = await fetch(\`\${API_URL}/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    
    return response.json();
  },

  // Verificar token
  async verifyToken() {
    const token = this.getToken();
    if (!token) return null;
    
    const response = await fetch(\`\${API_URL}/auth/verify\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.valid ? data.user : null;
  },

  // Obtener token
  getToken() {
    return localStorage.getItem('motobombon_token');
  },

  // Logout
  logout() {
    localStorage.removeItem('motobombon_token');
    localStorage.removeItem('motobombon_is_admin');
    localStorage.removeItem('motobombon_user_role');
    localStorage.removeItem('motobombon_user_name');
  },

  // Obtener datos del usuario
  getUser() {
    return {
      role: localStorage.getItem('motobombon_user_role'),
      name: localStorage.getItem('motobombon_user_name'),
      isAdmin: localStorage.getItem('motobombon_user_role') === 'admin'
    };
  }
};
```

---

## Actualizar Servicios para Incluir Token

### Ejemplo: `citasService.js`

ANTES:
```javascript
export async function getCitas() {
  const res = await fetch('http://localhost:3001/api/citas');
  return res.json();
}
```

DESPUÉS:
```javascript
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': \`Bearer \${token}\` })
  };
}

export async function getCitas() {
  const res = await fetch(\`\${API_URL}/citas\`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function addCita(data) {
  const res = await fetch(\`\${API_URL}/citas\`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}
```

---

## Proteger Rutas en el Backend

### Actualizar `backend/routes/nomina.js`

ANTES:
```javascript
router.get("/", async (req, res) => {
  // Sin protección
});
```

DESPUÉS:
```javascript
import { verifyToken, requireAuth } from '../middleware/auth.js';

// Proteger todas las rutas de nómina (solo usuarios autenticados)
router.use(verifyToken);
router.use(requireAuth);

router.get("/", async (req, res) => {
  // Solo accesible con token válido
});
```

### Actualizar `backend/routes/lavadores.js`

```javascript
import { verifyToken, requireAdmin } from '../middleware/auth.js';

// Solo admins pueden modificar lavadores
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  // Solo admin
});

router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  // Solo admin
});

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  // Solo admin
});

// Lectura permitida para todos los autenticados
router.get("/", verifyToken, async (req, res) => {
  // Supervisor y admin
});
```

---

## Variables de Entorno Frontend

Crea `Frontend/.env.development`:

```env
VITE_API_URL=http://localhost:3001/api
```

Crea `Frontend/.env.production`:

```env
VITE_API_URL=https://tudominio.com/api
```

---

## Actualizar AdminLayout.jsx para Logout Seguro

```jsx
import { authService } from '../services/authService';

const handleLogout = () => {
  authService.logout();
  navigate('/admin/login');
};
```

---

## Testing del Sistema de Autenticación

### 1. Generar Hashes de Contraseñas

```bash
cd backend
npm run generate-hash
# Ingresa: TuContraseñaSegura123!
# Copia el hash generado
```

### 2. Actualizar .env

```env
ADMIN_PASSWORD_HASH=$2b$10$[TU_HASH_AQUI]
SUPERVISOR_PASSWORD_HASH=$2b$10$[TU_HASH_AQUI]
JWT_SECRET=mi_secreto_super_largo_y_aleatorio_minimo_32_caracteres
```

### 3. Reiniciar Backend

```bash
# Detener servidor actual (Ctrl+C)
npm start
```

### 4. Probar Login

1. Ir a http://localhost:5173/admin/login
2. Usuario: `admin`
3. Contraseña: `TuContraseñaSegura123!` (la que usaste para generar hash)
4. Verificar que redirige a /admin

### 5. Verificar Token en DevTools

1. Abrir DevTools (F12)
2. Application → Local Storage
3. Debe aparecer `motobombon_token` con un JWT

---

## Migración Gradual (Si Ya Está en Producción)

### Fase 1: Mantener Compatibilidad
- Mantén el login antiguo funcionando
- Agrega el nuevo endpoint `/api/auth/login`
- Frontend soporta ambos métodos

### Fase 2: Testing
- Prueba login nuevo en ambiente de desarrollo
- Verifica que todos los usuarios pueden acceder
- Documenta nuevas contraseñas

### Fase 3: Migración
- Notifica a usuarios del cambio
- Cambia frontend para usar solo nuevo método
- Monitorea errores

### Fase 4: Limpieza
- Elimina código antiguo de autenticación
- Actualiza documentación

---

## Checklist de Implementación

```
☐ Crear authService.js en frontend
☐ Actualizar LoginAdmin.jsx para usar JWT
☐ Actualizar todos los servicios (citasService, etc) para incluir token
☐ Crear middleware/auth.js en backend
☐ Crear routes/auth.js en backend
☐ Proteger rutas sensibles con verifyToken
☐ Generar hashes de contraseñas (npm run generate-hash)
☐ Actualizar .env con JWT_SECRET y hashes
☐ Crear .env.development y .env.production en frontend
☐ Reiniciar backend
☐ Probar login con nuevas credenciales
☐ Verificar que token se guarda en localStorage
☐ Probar acceso a rutas protegidas
☐ Verificar que logout funciona correctamente
☐ Documentar nuevas contraseñas en lugar seguro
```

---

**IMPORTANTE**: 
- Nunca compartas el archivo `.env` con nadie
- No subas `.env` a Git (verificar .gitignore)
- Usa contraseñas diferentes en desarrollo y producción
- Cambia contraseñas cada 3-6 meses
- Usa gestor de contraseñas (1Password, Bitwarden, etc)
