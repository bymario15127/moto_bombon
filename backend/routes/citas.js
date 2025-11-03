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
    const citas = await db.all("SELECT * FROM citas ORDER BY fecha, hora");
    res.json(citas);
  } catch (error) {
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

// POST create con verificación de traslapes por duración
router.post("/", async (req, res) => {
  try {
    const { cliente, servicio, fecha, hora, telefono, email, comentarios, estado } = req.body;
    
    if (!cliente || !servicio || !fecha || !hora) {
      return res.status(400).json({ error: "Campos obligatorios: cliente, servicio, fecha, hora" });
    }
    
    if (!fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
    }
    
    if (!hora.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({ error: "Formato de hora inválido. Use HH:MM" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Correo electrónico inválido" });
    }
    
    // Duración del nuevo servicio
    const servicioRow = await db.get(
      "SELECT duracion FROM servicios WHERE nombre = ?",
      [servicio]
    );
    const duracionNueva = servicioRow?.duracion ? Number(servicioRow.duracion) : 60; // default 60
    const inicioNueva = toMinutes(hora);
    const finNueva = inicioNueva + duracionNueva;

    // Buscar citas existentes del día y verificar traslape con su duración real
    const existentes = await db.all(
      `SELECT c.hora as hora, COALESCE(s.duracion, 60) as duracion
       FROM citas c
       LEFT JOIN servicios s ON s.nombre = c.servicio
       WHERE c.fecha = ? AND (c.estado IS NULL OR c.estado != 'cancelada')`,
      [fecha]
    );

    const hayTraslape = existentes.some((c) => {
      const inicio = toMinutes(c.hora);
      const fin = inicio + Number(c.duracion || 60);
      return inicioNueva < fin && finNueva > inicio; // overlap
    });

    if (hayTraslape) {
      return res.status(409).json({
        error: "El horario seleccionado se traslapa con otra cita. Elige otra hora."
      });
    }
    
    const result = await db.run(
      "INSERT INTO citas (cliente, servicio, fecha, hora, telefono, email, comentarios, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [cliente, servicio, fecha, hora, telefono || "", email || "", comentarios || "", estado || "pendiente"]
    );
    
    res.status(201).json({ id: result.lastID, message: "Cita creada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
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
  const allowedFields = ['cliente', 'servicio', 'fecha', 'hora', 'telefono', 'email', 'comentarios', 'estado'];
    
    for (const key of Object.keys(fields)) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({ error: `Campo no permitido: ${key}` });
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
