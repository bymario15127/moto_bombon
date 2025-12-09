// backend/routes/citas.js
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;
(async () => {
  db = await open({
    filename: path.join(__dirname, "../database/database.sqlite"),
    driver: sqlite3.Database,
  });
  // Ensure 'email' column exists in 'citas'
  try {
    const columns = await db.all("PRAGMA table_info(citas)");
    const hasEmail = columns.some((c) => c.name === "email");
    if (!hasEmail) {
      await db.exec("ALTER TABLE citas ADD COLUMN email TEXT");
    }
  } catch (_) {
    // ignore migration errors silently
  }
})();

// GET all
router.get("/", async (req, res) => {
  try {
    const citas = await db.all(`
      SELECT c.*, l.nombre as lavador_nombre 
      FROM citas c
      LEFT JOIN lavadores l ON c.lavador_id = l.id
      ORDER BY c.fecha ASC, c.hora ASC
    `);
    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET horarios ocupados para una fecha específica
router.get("/ocupados/:fecha", async (req, res) => {
  try {
    const { fecha } = req.params;
    
    if (!fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: "Formato de fecha inválido" });
    }
    
    const horariosOcupados = await db.all(
      "SELECT hora FROM citas WHERE fecha = ? AND estado != 'cancelada'",
      [fecha]
    );
    
    res.json(horariosOcupados.map(cita => cita.hora));
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
// Helpers
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(n => parseInt(n, 10));
  return h * 60 + m;
};

// Rate limit simple en memoria para evitar abuso (30 req / 10 min por IP)
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 30;
const rateStore = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const record = rateStore.get(ip) || { count: 0, start: now };
  if (now - record.start > RATE_WINDOW_MS) {
    record.count = 0;
    record.start = now;
  }
  record.count += 1;
  rateStore.set(ip, record);
  if (record.count > RATE_MAX) {
    return res.status(429).json({ error: "Demasiadas solicitudes, intenta en unos minutos" });
  }
  next();
}

// Validación de token de acceso para clientes y talleres
const CLIENT_TOKEN = process.env.ACCESS_TOKEN_CLIENTE || process.env.CLIENT_ACCESS_TOKEN || "CLIENTE_DEFAULT_TOKEN";
const TALLER_TOKEN = process.env.ACCESS_TOKEN_TALLER || process.env.TALLER_ACCESS_TOKEN || "TALLER_DEFAULT_TOKEN";

function verifyAccessToken(req, res, next) {
  const token = req.headers['x-access-token'] || req.query.token || req.body?.token;
  if (!token) {
    return res.status(401).json({ error: "Acceso no autorizado" });
  }
  const esTaller = req.body?.tipo_cliente === 'taller';
  if (esTaller) {
    if (token !== TALLER_TOKEN) {
      return res.status(401).json({ error: "Token inválido para taller" });
    }
  } else {
    if (token !== CLIENT_TOKEN && token !== TALLER_TOKEN) {
      return res.status(401).json({ error: "Token inválido" });
    }
  }
  next();
}

// POST create (hora y fecha opcionales; si no se envían, se registra para HOY y sin hora)
router.post("/", rateLimit, verifyAccessToken, async (req, res) => {
  try {
    console.log("📥 [POST /api/citas] Payload recibido:", req.body);
    const { cliente, servicio, fecha, hora, telefono, email, comentarios, estado, placa, marca, modelo, cilindraje, metodo_pago, lavador_id, tipo_cliente, taller_id } = req.body;
    
    if (!cliente || !servicio) {
      return res.status(400).json({ error: "Campos obligatorios: cliente, servicio" });
    }
    
    // Calcular fecha por defecto (hoy) si no se envía
    const todayStr = () => {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const fechaFinal = (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) ? fecha : todayStr();
    
    // Validar hora solo si viene
    let horaFinal = null;
    if (hora) {
      if (!/^\d{2}:\d{2}$/.test(hora)) {
        return res.status(400).json({ error: "Formato de hora inválido. Use HH:MM" });
      }
      horaFinal = hora;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Correo electrónico inválido" });
    }
    
    // Validar cilindraje si se proporciona
    if (cilindraje) {
      const cc = Number(cilindraje);
      if (isNaN(cc) || cc < 50 || cc > 2000) {
        return res.status(400).json({ error: "Cilindraje inválido. Debe estar entre 50 y 2000 cc" });
      }
    }
    
    // Validar método de pago
    const metodosValidos = ["codigo_qr", "efectivo", null, "", undefined];
    if (!metodosValidos.includes(metodo_pago)) {
      return res.status(400).json({ error: "Método de pago inválido. Use 'codigo_qr' o 'efectivo'" });
    }

    // Si no se envía hora, no aplicamos verificación de traslapes
    if (horaFinal) {
      // Duración del nuevo servicio
      const servicioRow = await db.get(
        "SELECT duracion FROM servicios WHERE nombre = ?",
        [servicio]
      );
      const duracionNueva = servicioRow?.duracion ? Number(servicioRow.duracion) : 60; // default 60
      const inicioNueva = toMinutes(horaFinal);
      const finNueva = inicioNueva + duracionNueva;

      // Buscar citas existentes del día y verificar traslape con su duración real
      const existentes = await db.all(
        `SELECT c.hora as hora, COALESCE(s.duracion, 60) as duracion
         FROM citas c
         LEFT JOIN servicios s ON s.nombre = c.servicio
         WHERE c.fecha = ? AND (c.estado IS NULL OR c.estado != 'cancelada')`,
        [fechaFinal]
      );

      const hayTraslape = existentes.some((c) => {
        if (!c.hora) return false;
        const inicio = toMinutes(c.hora);
        const fin = inicio + Number(c.duracion || 60);
        return inicioNueva < fin && finNueva > inicio; // overlap
      });

      if (hayTraslape) {
        return res.status(409).json({
          error: "El horario seleccionado se traslapa con otra cita. Elige otra hora."
        });
      }
    }
    
    try {
      const result = await db.run(
        "INSERT INTO citas (cliente, servicio, fecha, hora, telefono, email, comentarios, estado, placa, marca, modelo, cilindraje, metodo_pago, lavador_id, tipo_cliente, taller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [cliente, servicio, fechaFinal, horaFinal, telefono || "", email || "", comentarios || "", estado || "pendiente", placa || "", marca || "", modelo || "", cilindraje || null, metodo_pago || null, lavador_id || null, tipo_cliente || "cliente", taller_id || null]
      );
      console.log("✅ Cita insertada ID=", result.lastID);
      return res.status(201).json({ id: result.lastID, message: "Cita creada exitosamente" });
    } catch (dbError) {
      console.error("❌ Error ejecutando INSERT en citas:", dbError);
      if (dbError.message?.includes("NOT NULL") || dbError.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: "Error de datos: " + dbError.message });
      }
      return res.status(500).json({ error: "Error guardando la cita" });
    }
  } catch (error) {
    console.error("🔥 Error inesperado en POST /api/citas:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de cita inválido" });
    }
    
    const updates = [];
    const values = [];
  const allowedFields = ['cliente', 'servicio', 'fecha', 'hora', 'telefono', 'email', 'comentarios', 'estado', 'placa', 'marca', 'modelo', 'cilindraje', 'metodo_pago', 'lavador_id'];
    
    for (const key of Object.keys(fields)) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({ error: `Campo no permitido: ${key}` });
      }
      
      // Validar cilindraje si se está actualizando
      if (key === 'cilindraje' && fields[key]) {
        const cc = Number(fields[key]);
        if (isNaN(cc) || cc < 50 || cc > 2000) {
          return res.status(400).json({ error: "Cilindraje inválido. Debe estar entre 50 y 2000 cc" });
        }
      }

      // Validar método de pago si se actualiza
      if (key === 'metodo_pago' && fields[key]) {
        const metodosValidosUpdate = ["codigo_qr", "efectivo"];
        if (!metodosValidosUpdate.includes(fields[key])) {
          return res.status(400).json({ error: "Método de pago inválido. Use 'codigo_qr' o 'efectivo'" });
        }
      }
      
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }
    
    values.push(id);
    const result = await db.run(`UPDATE citas SET ${updates.join(", ")} WHERE id = ?`, values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    res.json({ message: "Cita actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de cita inválido" });
    }
    
    const result = await db.run("DELETE FROM citas WHERE id = ?", id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    res.json({ message: "Cita eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
