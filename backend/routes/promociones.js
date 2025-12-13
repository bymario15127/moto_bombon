// backend/routes/promociones.js
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
})();

// GET todas las promociones (solo activas por defecto)
router.get("/", async (req, res) => {
  try {
    const incluirInactivas = req.query.all === 'true';
    let query = "SELECT * FROM promociones";
    
    if (!incluirInactivas) {
      query += " WHERE activo = 1";
    }
    
    query += " ORDER BY fecha_inicio DESC, nombre";
    
    const promociones = await db.all(query);
    res.json(promociones);
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET promociones vigentes (entre fecha_inicio y fecha_fin)
router.get("/vigentes", async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    
    const promociones = await db.all(`
      SELECT * FROM promociones 
      WHERE activo = 1 
        AND (fecha_inicio IS NULL OR fecha_inicio <= ?)
        AND (fecha_fin IS NULL OR fecha_fin >= ?)
      ORDER BY nombre
    `, [hoy, hoy]);
    
    res.json(promociones);
  } catch (error) {
    console.error("Error al obtener promociones vigentes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST crear promoción
router.post("/", async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      precio_cliente_bajo_cc, 
      precio_cliente_alto_cc,
      precio_comision_bajo_cc,
      precio_comision_alto_cc,
      duracion,
      activo,
      fecha_inicio,
      fecha_fin,
      imagen,
      imagen_bajo_cc,
      imagen_alto_cc
    } = req.body;
    
    if (!nombre || !precio_comision_bajo_cc || !precio_comision_alto_cc || !duracion) {
      return res.status(400).json({ 
        error: "Campos obligatorios: nombre, precio_comision_bajo_cc, precio_comision_alto_cc, duracion" 
      });
    }
    
    console.log("📸 Imágenes recibidas:", { imagen, imagen_bajo_cc, imagen_alto_cc });
    console.log("📊 Body completo:", req.body);
    
    const result = await db.run(`
      INSERT INTO promociones (
        nombre, 
        descripcion, 
        precio_cliente_bajo_cc, 
        precio_cliente_alto_cc,
        precio_comision_bajo_cc,
        precio_comision_alto_cc,
        duracion,
        activo,
        fecha_inicio,
        fecha_fin,
        imagen,
        imagen_bajo_cc,
        imagen_alto_cc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre,
      descripcion || '',
      precio_cliente_bajo_cc || null,
      precio_cliente_alto_cc || null,
      precio_comision_bajo_cc,
      precio_comision_alto_cc,
      duracion,
      activo !== undefined ? activo : 1,
      fecha_inicio || null,
      fecha_fin || null,
      imagen || '/img/default.jpg',
      imagen_bajo_cc || '',
      imagen_alto_cc || ''
    ]);    res.status(201).json({ 
      id: result.lastID, 
      message: "Promoción creada exitosamente" 
    });
  } catch (error) {
    console.error("Error al crear promoción:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT actualizar promoción
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      precio_cliente_bajo_cc, 
      precio_cliente_alto_cc,
      precio_comision_bajo_cc,
      precio_comision_alto_cc,
      duracion,
      activo,
      fecha_inicio,
      fecha_fin,
      imagen,
      imagen_bajo_cc,
      imagen_alto_cc
    } = req.body;
    
    console.log(`🔧 Actualizando promo ${id}`);
    console.log("📸 Imágenes en PUT:", { imagen, imagen_bajo_cc, imagen_alto_cc });
    console.log("📊 Body completo:", req.body);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de promoción inválido" });
    }
    
    const result = await db.run(`
      UPDATE promociones 
      SET nombre = ?, 
          descripcion = ?, 
          precio_cliente_bajo_cc = ?, 
          precio_cliente_alto_cc = ?,
          precio_comision_bajo_cc = ?,
          precio_comision_alto_cc = ?,
          duracion = ?,
          activo = ?,
          fecha_inicio = ?,
          fecha_fin = ?,
          imagen = ?,
          imagen_bajo_cc = ?,
          imagen_alto_cc = ?
      WHERE id = ?
    `, [
      nombre,
      descripcion,
      precio_cliente_bajo_cc || null,
      precio_cliente_alto_cc || null,
      precio_comision_bajo_cc,
      precio_comision_alto_cc,
      duracion,
      activo !== undefined ? activo : 1,
      fecha_inicio || null,
      fecha_fin || null,
      imagen || '/img/default.jpg',
      imagen_bajo_cc || '',
      imagen_alto_cc || '',
      id
    ]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }
    
    res.json({ message: "Promoción actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar promoción:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE promoción (desactivar)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de promoción inválido" });
    }
    
    const result = await db.run(
      "UPDATE promociones SET activo = 0 WHERE id = ?",
      [id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }
    
    res.json({ message: "Promoción desactivada exitosamente" });
  } catch (error) {
    console.error("Error al desactivar promoción:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
