# 🏍️ MOTOBOMBON - Sistema de Reservas

Sistema completo de gestión de citas para un lavamotors especializado en lavado y cuidado de motocicletas.

## 🚀 Características

### Cliente
- Formulario de reservas intuitivo
- Selector de servicios de lavado con imágenes
- Calendario con horarios disponibles
- Validación de horarios ocupados en tiempo real
- Confirmación instantánea de reservas

### Administrador
- Dashboard con estadísticas en tiempo real
- Calendario de citas con vista diaria
- Gestión completa de citas (confirmar, completar, cancelar)
- CRUD de servicios de lavado (crear, editar, eliminar)
- Sistema de autenticación simple

## 📁 Estructura del Proyecto

```
MOTOBOMBON/
├── Frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/       # Componentes del panel admin
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── CalendarAdmin.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── LoginAdmin.jsx
│   │   │   │   ├── PanelAdmin.jsx
│   │   │   │   ├── ServiciosManager.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   └── Cliente/
│   │   │       └── ReservaForm.jsx
│   │   ├── pages/
│   │   │   ├── AdminPage.jsx
│   │   │   ├── ClientePage.jsx
│   │   │   └── HomePage.jsx
│   │   ├── services/
│   │   │   ├── citasService.js
│   │   │   └── serviciosService.js
│   │   ├── index.css         # Estilos globales
│   │   ├── router.jsx        # Configuración de rutas
│   │   └── main.jsx
│   ├── public/
│   │   └── img/             # Imágenes de servicios
│   ├── package.json
│   └── vite.config.js       # Proxy para desarrollo
│
└── backend/                  # Node.js + Express + SQLite
    ├── routes/
    │   ├── citas.js         # CRUD de citas
    │   └── servicios.js     # CRUD de servicios
    ├── database/
    │   ├── database.sqlite  # Base de datos SQLite
    │   ├── init.js          # Script de inicialización
    │   └── initServicios.js # Servicios por defecto
    ├── index.js             # Servidor principal
    └── package.json
```

## 🛠️ Tecnologías

### Frontend
- **React 18** - Framework de UI
- **Vite** - Build tool
- **React Router** - Navegación
- **React DatePicker** - Selector de fechas
- **date-fns** - Manejo de fechas
- **CSS personalizado** - Diseño sin frameworks

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **SQLite** - Base de datos
- **CORS** - Comunicación frontend-backend

## 📦 Instalación

### Backend
```bash
cd backend
npm install
npm start
```

El servidor correrá en `http://localhost:3000`

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

El frontend correrá en `http://localhost:5173` (o 5174 si el puerto está ocupado)

## 🗄️ Base de Datos

### Tabla: `citas`
```sql
CREATE TABLE citas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT NOT NULL,
  servicio TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  telefono TEXT,
  comentarios TEXT,
  estado TEXT DEFAULT 'pendiente'
);
```

### Tabla: `servicios`
```sql
CREATE TABLE servicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  duracion INTEGER NOT NULL,
  precio REAL NOT NULL,
  descripcion TEXT,
  imagen TEXT
);
```

## 🔐 Autenticación Admin

- **Usuario:** `admin`
- **Contraseña:** `MOTOBOMBON123`

El sistema usa `localStorage` para mantener la sesión. Para producción, se recomienda implementar JWT.

## 🎨 Paleta de Colores

- **Principal:** `#EB0463` (Rosa/Magenta MOTOBOMBON)
- **Secundario:** `#E0FF00` (Amarillo/Lima)
- **Blanco:** `#F4F4F4` (Blanco)
- **Negro:** `#161616` (Negro)
- **Fondos:** Degradados de magenta a amarillo lima

## 📱 Rutas

### Cliente
- `/` - Página de inicio
- `/cliente` o `/reserva` - Formulario de reservas

### Admin
- `/login` - Login de administrador
- `/admin` - Panel de administración (protegido)

## 🔧 Configuración de Desarrollo

El archivo `vite.config.js` incluye un proxy para evitar problemas de CORS:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## 📝 API Endpoints

### Citas
- `GET /api/citas` - Obtener todas las citas
- `POST /api/citas` - Crear nueva cita
- `PUT /api/citas/:id` - Actualizar cita
- `DELETE /api/citas/:id` - Eliminar cita
- `GET /api/citas/ocupados/:fecha` - Horarios ocupados

### Servicios
- `GET /api/servicios` - Obtener todos los servicios
- `POST /api/servicios` - Crear nuevo servicio
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Eliminar servicio

## 🚀 Deploy

### Backend
1. Configurar variable de entorno `PORT`
2. Asegurar que `database.sqlite` esté incluido
3. Usar PM2 o similar para mantener el proceso activo

### Frontend
1. Actualizar URLs de API en producción
2. Ejecutar `npm run build`
3. Servir la carpeta `dist/` con Nginx o similar

## 🐛 Troubleshooting

### El backend no inicia
- Verificar que el puerto 3000 esté disponible
- Revisar que las dependencias estén instaladas
- Comprobar que `database.sqlite` exista

### Frontend no se conecta al backend
- Verificar que ambos servidores estén corriendo
- Revisar configuración del proxy en `vite.config.js`
- Comprobar la consola del navegador para errores CORS

### La base de datos está vacía
```bash
cd backend
node database/init.js
node database/initServicios.js
```

## 📄 Licencia

Proyecto privado - MOTOBOMBON © 2025

## 👥 Autor

Desarrollado para MOTOBOMBON Lavamotors
