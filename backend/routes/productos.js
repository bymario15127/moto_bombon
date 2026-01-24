// backend/routes/productos.js
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken, requireAdminOrSupervisor } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

const dbReady = (async () => {
  db = await open({
    filename: path.join(__dirname, "../database/database.sqlite"),
    driver: sqlite3.Database,
  });

  // Crear tablas si no existen
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        precio_compra REAL NOT NULL,
        precio_venta REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        total REAL NOT NULL,
        registrado_por TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);
  } catch (error) {
    console.error("❌ Error creando tablas:", error);
  }
})();

// GET - Listar todos los productos
router.get("/", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const productos = await db.all("SELECT * FROM productos ORDER BY nombre");
    res.json(productos);
  } catch (error) {
    console.error("❌ Error obteniendo productos:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo producto
router.post("/", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { nombre, precio_compra, precio_venta, stock = 0 } = req.body;

    if (!nombre || !precio_compra || !precio_venta) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (precio_venta < precio_compra) {
      return res.status(400).json({ error: "El precio de venta debe ser mayor o igual al de compra" });
    }

    const result = await db.run(
      "INSERT INTO productos (nombre, precio_compra, precio_venta, stock) VALUES (?, ?, ?, ?)",
      [nombre, precio_compra, precio_venta, stock]
    );

    res.json({
      id: result.lastID,
      nombre,
      precio_compra,
      precio_venta,
      stock
    });
  } catch (error) {
    console.error("❌ Error creando producto:", error);
    if (error.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "El producto ya existe" });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar producto
router.put("/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { id } = req.params;
    const { nombre, precio_compra, precio_venta, stock } = req.body;

    if (!nombre || !precio_compra || !precio_venta) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (precio_venta < precio_compra) {
      return res.status(400).json({ error: "El precio de venta debe ser mayor o igual al de compra" });
    }

    await db.run(
      "UPDATE productos SET nombre = ?, precio_compra = ?, precio_venta = ?, stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [nombre, precio_compra, precio_venta, stock, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error actualizando producto:", error);
    if (error.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "El nombre del producto ya existe" });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar producto
router.delete("/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { id } = req.params;

    await db.run("DELETE FROM productos WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error eliminando producto:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Registrar venta
router.post("/venta/registrar", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { producto_id, cantidad } = req.body;
    const registrado_por = req.user.username;

    if (!producto_id || !cantidad) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
    }

    // Obtener producto
    const producto = await db.get("SELECT * FROM productos WHERE id = ?", [producto_id]);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Validar stock
    if (producto.stock < cantidad) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    const total = cantidad * producto.precio_venta;

    // Registrar venta (dejar que SQLite use CURRENT_TIMESTAMP)
    const result = await db.run(
      "INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, registrado_por) VALUES (?, ?, ?, ?, ?)",
      [producto_id, cantidad, producto.precio_venta, total, registrado_por]
    );

    // Actualizar stock
    await db.run(
      "UPDATE productos SET stock = stock - ? WHERE id = ?",
      [cantidad, producto_id]
    );

    res.json({
      id: result.lastID,
      producto_id,
      cantidad,
      precio_unitario: producto.precio_venta,
      total,
      registrado_por
    });
  } catch (error) {
    console.error("❌ Error registrando venta:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Reportes de ventas
router.get("/reportes/diarias", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { fecha } = req.query;

    let query = `
      SELECT 
        v.id,
        p.nombre as producto,
        v.cantidad,
        v.precio_unitario,
        v.total,
        p.precio_compra,
        (v.precio_unitario - p.precio_compra) * v.cantidad as ganancia,
        v.registrado_por,
        v.created_at
      FROM ventas v
      JOIN productos p ON v.producto_id = p.id
    `;

    let params = [];

    if (fecha) {
      // Convertir fecha de Colombia a rango UTC
      // Si piden 2026-01-23 en Colombia, necesito buscar desde 2026-01-23 05:00:00 UTC hasta 2026-01-24 04:59:59 UTC
      const [year, month, day] = fecha.split('-');
      const fechaInicio = `${fecha} 05:00:00`; // Medianoche en Colombia = 5 AM UTC
      
      // Calcular día siguiente
      const fechaDate = new Date(fecha);
      fechaDate.setDate(fechaDate.getDate() + 1);
      const yearNext = fechaDate.getFullYear();
      const monthNext = String(fechaDate.getMonth() + 1).padStart(2, '0');
      const dayNext = String(fechaDate.getDate()).padStart(2, '0');
      const fechaFin = `${yearNext}-${monthNext}-${dayNext} 04:59:59`;
      
      query += " WHERE v.created_at >= ? AND v.created_at <= ?";
      params.push(fechaInicio, fechaFin);
    }

    query += " ORDER BY v.created_at DESC";

    const ventas = await db.all(query, params);

    // Calcular totales
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalGanancia = ventas.reduce((sum, v) => sum + v.ganancia, 0);

    res.json({
      ventas,
      resumen: {
        totalVentas,
        totalGanancia,
        cantidadVentas: ventas.length
      }
    });
  } catch (error) {
    console.error("❌ Error obteniendo reportes:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Resumen de ganancias por período
router.get("/reportes/ganancias", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { desde, hasta } = req.query;

    let query = `
      SELECT 
        DATE(v.created_at) as fecha,
        COUNT(*) as cantidad_ventas,
        SUM(v.total) as total_ventas,
        SUM((v.precio_unitario - p.precio_compra) * v.cantidad) as ganancia_neta
      FROM ventas v
      JOIN productos p ON v.producto_id = p.id
    `;

    let params = [];
    const conditions = [];

    if (desde) {
      conditions.push("DATE(v.created_at) >= ?");
      params.push(desde);
    }

    if (hasta) {
      conditions.push("DATE(v.created_at) <= ?");
      params.push(hasta);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY DATE(v.created_at) ORDER BY fecha DESC";

    const reportes = await db.all(query, params);
    res.json(reportes);
  } catch (error) {
    console.error("❌ Error obteniendo reportes:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar venta
router.delete("/venta/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { id } = req.params;

    // Obtener la venta antes de eliminarla para devolver el stock
    const venta = await db.get(
      "SELECT producto_id, cantidad FROM ventas WHERE id = ?",
      [id]
    );

    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // Devolver el stock al producto
    await db.run(
      "UPDATE productos SET stock = stock + ? WHERE id = ?",
      [venta.cantidad, venta.producto_id]
    );

    // Eliminar la venta
    await db.run("DELETE FROM ventas WHERE id = ?", [id]);

    res.json({ success: true, message: "Venta eliminada y stock restaurado" });
  } catch (error) {
    console.error("❌ Error eliminando venta:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
