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
})();

// GET all servicios
router.get("/", async (req, res) => {
  try {
    const servicios = await db.all("SELECT * FROM servicios ORDER BY nombre");
    res.json(servicios);
  } catch (error) {
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