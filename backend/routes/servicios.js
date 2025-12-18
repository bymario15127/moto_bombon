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
// Garantiza que la BD esté lista antes de atender solicitudes
const dbReady = (async () => {
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
    // Parchear columnas faltantes en instalaciones antiguas
    const cols = await db.all("PRAGMA table_info(servicios)");
    const has = (n) => Array.isArray(cols) && cols.some(c => c.name === n);
    const alterStmts = [];
    if (!has('precio_bajo_cc')) alterStmts.push("ALTER TABLE servicios ADD COLUMN precio_bajo_cc REAL");
    if (!has('precio_alto_cc')) alterStmts.push("ALTER TABLE servicios ADD COLUMN precio_alto_cc REAL");
    if (!has('imagen_bajo_cc')) alterStmts.push("ALTER TABLE servicios ADD COLUMN imagen_bajo_cc TEXT");
    if (!has('imagen_alto_cc')) alterStmts.push("ALTER TABLE servicios ADD COLUMN imagen_alto_cc TEXT");
    if (!has('precio_base_comision_bajo')) alterStmts.push("ALTER TABLE servicios ADD COLUMN precio_base_comision_bajo REAL");
    if (!has('precio_base_comision_alto')) alterStmts.push("ALTER TABLE servicios ADD COLUMN precio_base_comision_alto REAL");

    for (const stmt of alterStmts) {
      try {
        await db.exec(stmt);
      } catch (e) {
        if (!/duplicate column|already exists/i.test(e.message || "")) {
          console.error("Error aplicando parche de esquema en servicios:", e.message);
        }
      }
    }
  } catch (e) {
    console.error("No se pudo asegurar tabla servicios:", e.message);
  }
})();

// GET solo servicios
router.get("/", async (req, res) => {
  try {
    await dbReady;
    const servicios = await db.all("SELECT * FROM servicios ORDER BY nombre");
    const serviciosConTipo = servicios.map(s => ({...s, tipo: 'servicio'}));
    res.json(serviciosConTipo);
  } catch (error) {
    console.error("Error en GET /api/servicios:", error);
    res.status(500).json({ error: "Error interno del servidor", detail: error?.message });
  }
});

// POST create servicio
router.post("/", async (req, res) => {
  try {
    await dbReady;
    const {
      nombre,
      duracion,
      precio,
      descripcion,
      imagen,
      precio_bajo_cc,
      precio_alto_cc,
      imagen_bajo_cc,
      imagen_alto_cc,
      precio_base_comision_bajo,
      precio_base_comision_alto,
    } = req.body;

    // Normalización y validaciones
    const duracionNum = Number(duracion);
    const precioNum = precio !== undefined && precio !== null ? Number(precio) : null;
    const precioBajoNum = precio_bajo_cc !== undefined && precio_bajo_cc !== null ? Number(precio_bajo_cc) : null;
    const precioAltoNum = precio_alto_cc !== undefined && precio_alto_cc !== null ? Number(precio_alto_cc) : null;
    const precioBaseBajoNum = precio_base_comision_bajo !== undefined && precio_base_comision_bajo !== null ? Number(precio_base_comision_bajo) : (precioBajoNum ?? null);
    const precioBaseAltoNum = precio_base_comision_alto !== undefined && precio_base_comision_alto !== null ? Number(precio_base_comision_alto) : (precioAltoNum ?? null);

    if (!nombre || !duracionNum || Number.isNaN(duracionNum)) {
      return res.status(400).json({ error: "Campos obligatorios: nombre, duracion (número)" });
    }

    // Validar que al menos un precio esté presente (precio, precio_bajo_cc, o precio_alto_cc)
    if (precioNum === null && precioBajoNum === null && precioAltoNum === null) {
      return res.status(400).json({ error: "Debe proporcionar al menos un precio" });
    }

    let result;
    try {
      result = await db.run(
        "INSERT INTO servicios (nombre, duracion, precio, descripcion, imagen, precio_bajo_cc, precio_alto_cc, imagen_bajo_cc, imagen_alto_cc, precio_base_comision_bajo, precio_base_comision_alto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          nombre,
          duracionNum,
          Number.isNaN(precioNum) ? null : precioNum,
          descripcion || "",
          imagen || "/img/default.jpg",
          Number.isNaN(precioBajoNum) ? null : precioBajoNum,
          Number.isNaN(precioAltoNum) ? null : precioAltoNum,
          imagen_bajo_cc || null,
          imagen_alto_cc || null,
          Number.isNaN(precioBaseBajoNum) ? null : precioBaseBajoNum,
          Number.isNaN(precioBaseAltoNum) ? null : precioBaseAltoNum,
        ]
      );
    } catch (dbErr) {
      console.error("❌ Error INSERT en servicios. Payload:", {
        nombre,
        duracion: duracionNum,
        precio: precioNum,
        precio_bajo_cc: precioBajoNum,
        precio_alto_cc: precioAltoNum,
        imagen,
        imagen_bajo_cc,
        imagen_alto_cc,
        precio_base_comision_bajo: precioBaseBajoNum,
        precio_base_comision_alto: precioBaseAltoNum,
      });
      console.error("DB error:", dbErr);
      if (/no such column/i.test(dbErr.message || "")) {
        return res.status(500).json({ error: "Esquema desactualizado: faltan columnas en 'servicios'. Ejecuta deploy para migrar DB.", detail: dbErr.message });
      }
      if (dbErr.message?.includes("NOT NULL") || dbErr.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: "Error de datos: " + dbErr.message });
      }
      return res.status(500).json({ error: "Error guardando el servicio", detail: dbErr.message });
    }

    res.status(201).json({ id: result.lastID, message: "Servicio creado exitosamente" });
  } catch (error) {
    console.error("Error en POST /api/servicios:", error);
    res.status(500).json({ error: "Error interno del servidor", detail: error?.message });
  }
});

// PUT update servicio
router.put("/:id", async (req, res) => {
  try {
    await dbReady;
    const { id } = req.params;
    const {
      nombre,
      duracion,
      precio,
      descripcion,
      imagen,
      precio_bajo_cc,
      precio_alto_cc,
      imagen_bajo_cc,
      imagen_alto_cc,
      precio_base_comision_bajo,
      precio_base_comision_alto,
    } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de servicio inválido" });
    }

    const duracionNum = Number(duracion);
    const precioNum = precio !== undefined && precio !== null ? Number(precio) : null;
    const precioBajoNum = precio_bajo_cc !== undefined && precio_bajo_cc !== null ? Number(precio_bajo_cc) : null;
    const precioAltoNum = precio_alto_cc !== undefined && precio_alto_cc !== null ? Number(precio_alto_cc) : null;
    const precioBaseBajoNum = precio_base_comision_bajo !== undefined && precio_base_comision_bajo !== null ? Number(precio_base_comision_bajo) : null;
    const precioBaseAltoNum = precio_base_comision_alto !== undefined && precio_base_comision_alto !== null ? Number(precio_base_comision_alto) : null;

    const result = await db.run(
      "UPDATE servicios SET nombre = ?, duracion = ?, precio = ?, descripcion = ?, imagen = ?, precio_bajo_cc = ?, precio_alto_cc = ?, imagen_bajo_cc = ?, imagen_alto_cc = ?, precio_base_comision_bajo = ?, precio_base_comision_alto = ? WHERE id = ?",
      [
        nombre,
        Number.isNaN(duracionNum) ? null : duracionNum,
        Number.isNaN(precioNum) ? null : precioNum,
        descripcion || "",
        imagen || "/img/default.jpg",
        Number.isNaN(precioBajoNum) ? null : precioBajoNum,
        Number.isNaN(precioAltoNum) ? null : precioAltoNum,
        imagen_bajo_cc || null,
        imagen_alto_cc || null,
        Number.isNaN(precioBaseBajoNum) ? null : precioBaseBajoNum,
        Number.isNaN(precioBaseAltoNum) ? null : precioBaseAltoNum,
        id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    res.json({ message: "Servicio actualizado exitosamente" });
  } catch (error) {
    console.error("Error en PUT /api/servicios/:id:", error);
    res.status(500).json({ error: "Error interno del servidor", detail: error?.message });
  }
});

// DELETE servicio
router.delete("/:id", async (req, res) => {
  try {
    await dbReady;
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
    console.error("Error en DELETE /api/servicios/:id:", error);
    res.status(500).json({ error: "Error interno del servidor", detail: error?.message });
  }
});

export default router;