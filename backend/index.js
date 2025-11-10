// backend/index.js
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import citasRouter from "./routes/citas.js";
import serviciosRouter from "./routes/servicios.js";

const app = express();

// Configuración de CORS para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'] 
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
};

// Middleware de seguridad básico
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Logging mejorado
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

app.use(cors(corsOptions));
// Aumentar límite para permitir imágenes en base64
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Resolver __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta pública para archivos subidos
const uploadsDir = path.join(__dirname, 'uploads');
const servicesDir = path.join(uploadsDir, 'services');
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use("/api/citas", citasRouter);
app.use("/api/servicios", serviciosRouter);

// Subida de imagen vía base64 (evita dependencias externas)
app.post('/api/upload-image', async (req, res) => {
  try {
    const { image } = req.body; // dataURL: data:image/png;base64,AAAA
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Imagen inválida' });
    }
    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Formato de imagen no soportado' });
    }
    const mime = match[1];
    const base64Data = match[2];
    // Validar tipo permitido
    const allowed = new Set(['image/png','image/jpeg','image/jpg','image/webp']);
    if (!allowed.has(mime)) {
      return res.status(400).json({ error: 'Tipo de imagen no permitido' });
    }
    // Validar tamaño (máx 2 MB)
    const approxBytes = Math.ceil((base64Data.length * 3) / 4);
    if (approxBytes > 2 * 1024 * 1024) {
      return res.status(413).json({ error: 'Imagen demasiado grande (máx 2 MB)' });
    }
    const ext = mime.split('/')[1].replace('jpeg', 'jpg');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const filePath = path.join(servicesDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return res.json({ url: `/uploads/services/${filename}` });
  } catch (e) {
    return res.status(500).json({ error: 'No se pudo guardar la imagen' });
  }
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// 🔹 Ruta raíz
app.get("/", (req, res) => {
  res.send("🚀 Servidor backend funcionando correctamente");
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Directorio de uploads: ${path.join(__dirname, 'uploads')}`);
});
