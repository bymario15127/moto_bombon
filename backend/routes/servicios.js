// backend/routes/servicios.js
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
  // Asegurar tabla servicios en instalaciones antiguas
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS servicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        duracion INTEGER NOT NULL,
        precio REAL,
        descripcion TEXT,
        imagen TEXT,
        precio_bajo_cc REAL,
        precio_alto_cc REAL,
        imagen_bajo_cc TEXT,
        imagen_alto_cc TEXT,
        precio_base_comision_bajo REAL,
        precio_base_comision_alto REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error("No se pudo asegurar tabla servicios:", e.message);
  }
})();

// GET all servicios + promociones activas
router.get("/", async (req, res) => {
  try {
    // Obtener servicios normales
    const servicios = await db.all("SELECT * FROM servicios ORDER BY nombre");
    
    // Obtener promociones activas (vigentes hoy)
    const hoy = new Date().toISOString().split('T')[0];
    let promociones = [];
    try {
      // Si la tabla promociones no existe en algunos servidores antiguos,
      // devolvemos lista vacía en lugar de romper con 500.
      const cols = await db.all("PRAGMA table_info(promociones)");
      if (Array.isArray(cols) && cols.length > 0) {
        promociones = await db.all(
          `SELECT * FROM promociones 
           WHERE activo = 1 
           AND fecha_inicio <= ? 
           AND fecha_fin >= ? 
           ORDER BY nombre`,
          [hoy, hoy]
        );
      } else {
        promociones = [];
      }
    } catch (e) {
      // Si falla por "no such table", continuar con promociones vacías
      if (!/no such table/i.test(e.message || "")) {
        console.error("Error consultando promociones:", e.message);
      }
      promociones = [];
    }
    
    // Marcar servicios y promociones con tipo
    const serviciosConTipo = servicios.map(s => ({...s, tipo: 'servicio'}));
    const promocionesConTipo = promociones.map(p => ({...p, tipo: 'promocion'}));
    
    // Combinar y devolver
    const todos = [...serviciosConTipo, ...promocionesConTipo];
    res.json(todos);
  } catch (error) {
    console.error("Error en GET /api/servicios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST create servicio
router.post("/", async (req, res) => {
  try {
    const { nombre, duracion, precio, descripcion, imagen, precio_bajo_cc, precio_alto_cc, imagen_bajo_cc, imagen_alto_cc, precio_base_comision_bajo, precio_base_comision_alto } = req.body;
    
    if (!nombre || !duracion) {
      return res.status(400).json({ error: "Campos obligatorios: nombre, duracion" });
    }
    
    // Validar que al menos un precio esté presente (precio, precio_bajo_cc, o precio_alto_cc)
    if (!precio && !precio_bajo_cc && !precio_alto_cc) {
      return res.status(400).json({ error: "Debe proporcionar al menos un precio" });
    }
    
    const result = await db.run(
      "INSERT INTO servicios (nombre, duracion, precio, descripcion, imagen, precio_bajo_cc, precio_alto_cc, imagen_bajo_cc, imagen_alto_cc, precio_base_comision_bajo, precio_base_comision_alto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [nombre, duracion, precio || null, descripcion || "", imagen || "/img/default.jpg", precio_bajo_cc || null, precio_alto_cc || null, imagen_bajo_cc || null, imagen_alto_cc || null, precio_base_comision_bajo || precio_bajo_cc || null, precio_base_comision_alto || precio_alto_cc || null]
    );
    
    res.status(201).json({ id: result.lastID, message: "Servicio creado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT update servicio
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, duracion, precio, descripcion, imagen, precio_bajo_cc, precio_alto_cc, imagen_bajo_cc, imagen_alto_cc, precio_base_comision_bajo, precio_base_comision_alto } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de servicio inválido" });
    }
    
    const result = await db.run(
      "UPDATE servicios SET nombre = ?, duracion = ?, precio = ?, descripcion = ?, imagen = ?, precio_bajo_cc = ?, precio_alto_cc = ?, imagen_bajo_cc = ?, imagen_alto_cc = ?, precio_base_comision_bajo = ?, precio_base_comision_alto = ? WHERE id = ?",
      [nombre, duracion, precio || null, descripcion, imagen, precio_bajo_cc || null, precio_alto_cc || null, imagen_bajo_cc || null, imagen_alto_cc || null, precio_base_comision_bajo || null, precio_base_comision_alto || null, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    
    res.json({ message: "Servicio actualizado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE servicio
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de servicio inválido" });
    }
    
    const result = await db.run("DELETE FROM servicios WHERE id = ?", id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    
    res.json({ message: "Servicio eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;