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
    const { nombre, duracion, precio, descripcion, imagen } = req.body;
    
    if (!nombre || !duracion || !precio) {
      return res.status(400).json({ error: "Campos obligatorios: nombre, duracion, precio" });
    }
    
    const result = await db.run(
      "INSERT INTO servicios (nombre, duracion, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)",
      [nombre, duracion, precio, descripcion || "", imagen || "/img/default.jpg"]
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
    const { nombre, duracion, precio, descripcion, imagen } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de servicio inválido" });
    }
    
    const result = await db.run(
      "UPDATE servicios SET nombre = ?, duracion = ?, precio = ?, descripcion = ?, imagen = ? WHERE id = ?",
      [nombre, duracion, precio, descripcion, imagen, id]
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