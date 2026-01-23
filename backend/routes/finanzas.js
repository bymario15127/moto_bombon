// backend/routes/finanzas.js
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
})();

// GET - Dashboard financiero (resumen general)
router.get("/dashboard", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { mes, anio } = req.query;
    
    // Si no se especifica mes/año, usar el actual
    const fecha = new Date();
    const mesActual = mes || (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anioActual = anio || fecha.getFullYear().toString();
    
    // Ingresos por servicios (citas completadas del mes)
    const ingresosCitas = await db.get(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN s.precio_bajo_cc IS NOT NULL AND c.cilindraje <= 150 THEN s.precio_bajo_cc
          WHEN s.precio_alto_cc IS NOT NULL AND c.cilindraje > 150 THEN s.precio_alto_cc
          ELSE s.precio
        END
      ), 0) as total
      FROM citas c
      LEFT JOIN servicios s ON c.servicio = s.nombre
      WHERE c.estado = 'completada'
      AND strftime('%Y-%m', c.fecha) = ?
      AND c.taller_id IS NULL
    `, [`${anioActual}-${mesActual}`]);

    // Ingresos por productos (ventas del mes)
    const ingresosProductos = await db.get(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE strftime('%Y-%m', created_at) = ?
    `, [`${anioActual}-${mesActual}`]);

    // Gastos del mes (solo gastos manuales)
    const totalGastos = await db.get(`
      SELECT COALESCE(SUM(monto), 0) as total
      FROM gastos
      WHERE strftime('%Y-%m', fecha) = ?
    `, [`${anioActual}-${mesActual}`]);

    // Gastos por categoría
    const gastosPorCategoria = await db.all(`
      SELECT categoria, SUM(monto) as total
      FROM gastos
      WHERE strftime('%Y-%m', fecha) = ?
      GROUP BY categoria
      ORDER BY total DESC
    `, [`${anioActual}-${mesActual}`]);

    // Calcular totales
    const totalIngresos = (ingresosCitas?.total || 0) + (ingresosProductos?.total || 0);
    const totalGastosCompleto = totalGastos?.total || 0;
    const utilidadNeta = totalIngresos - totalGastosCompleto;

    res.json({
      ingresos: {
        servicios: ingresosCitas?.total || 0,
        productos: ingresosProductos?.total || 0,
        total: totalIngresos
      },
      gastos: {
        total: totalGastosCompleto,
        porCategoria: gastosPorCategoria
      },
      utilidadNeta,
      mes: mesActual,
      anio: anioActual
    });
  } catch (error) {
    console.error("❌ Error obteniendo dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Listar todos los gastos con filtros
router.get("/gastos", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { tipo, categoria, desde, hasta } = req.query;
    
    let query = "SELECT * FROM gastos WHERE 1=1";
    const params = [];

    if (tipo) {
      query += " AND tipo = ?";
      params.push(tipo);
    }

    if (categoria) {
      query += " AND categoria = ?";
      params.push(categoria);
    }

    if (desde) {
      query += " AND fecha >= ?";
      params.push(desde);
    }

    if (hasta) {
      query += " AND fecha <= ?";
      params.push(hasta);
    }

    query += " ORDER BY fecha DESC, id DESC";

    const gastos = await db.all(query, params);
    res.json(gastos);
  } catch (error) {
    console.error("❌ Error obteniendo gastos:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear gasto
router.post("/gastos", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { tipo, categoria, descripcion, monto, fecha, empleado_id, metodo_pago, estado, notas } = req.body;
    const registrado_por = req.user.username;

    if (!tipo || !categoria || !descripcion || !monto || !fecha) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (monto <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a 0" });
    }

    const result = await db.run(
      `INSERT INTO gastos (tipo, categoria, descripcion, monto, fecha, empleado_id, metodo_pago, estado, notas, registrado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, categoria, descripcion, monto, fecha, empleado_id || null, metodo_pago || null, estado || 'completado', notas || '', registrado_por]
    );

    res.json({
      id: result.lastID,
      tipo,
      categoria,
      descripcion,
      monto,
      fecha,
      empleado_id,
      metodo_pago,
      estado,
      notas,
      registrado_por
    });
  } catch (error) {
    console.error("❌ Error creando gasto:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar gasto
router.put("/gastos/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { id } = req.params;
    const { tipo, categoria, descripcion, monto, fecha, empleado_id, metodo_pago, estado, notas } = req.body;

    if (!tipo || !categoria || !descripcion || !monto || !fecha) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (monto <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a 0" });
    }

    await db.run(
      `UPDATE gastos 
       SET tipo = ?, categoria = ?, descripcion = ?, monto = ?, fecha = ?, empleado_id = ?, metodo_pago = ?, estado = ?, notas = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [tipo, categoria, descripcion, monto, fecha, empleado_id || null, metodo_pago || null, estado || 'completado', notas || '', id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error actualizando gasto:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar gasto
router.delete("/gastos/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { id } = req.params;

    await db.run("DELETE FROM gastos WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error eliminando gasto:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Reporte de movimientos (ingresos y gastos combinados)
router.get("/movimientos", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    await dbReady;
    const { mes, anio } = req.query;
    
    const fecha = new Date();
    const mesActual = mes || (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anioActual = anio || fecha.getFullYear().toString();

    // Gastos del mes
    const gastos = await db.all(`
      SELECT 'gasto' as tipo, fecha, descripcion, monto, categoria, registrado_por
      FROM gastos
      WHERE strftime('%Y-%m', fecha) = ?
      ORDER BY fecha DESC
    `, [`${anioActual}-${mesActual}`]);

    // Ingresos de productos
    const ingresosProductos = await db.all(`
      SELECT 'ingreso' as tipo, DATE(created_at) as fecha, 
             'Venta: ' || (SELECT nombre FROM productos WHERE id = producto_id) as descripcion,
             total as monto, 'Productos' as categoria, registrado_por
      FROM ventas
      WHERE strftime('%Y-%m', created_at) = ?
      ORDER BY created_at DESC
    `, [`${anioActual}-${mesActual}`]);

    // Ingresos de servicios (citas completadas)
    const ingresosServicios = await db.all(`
      SELECT 'ingreso' as tipo, c.fecha, 
             'Servicio: ' || c.servicio || ' - ' || c.cliente as descripcion,
             CASE 
               WHEN s.precio_bajo_cc IS NOT NULL AND c.cilindraje <= 150 THEN s.precio_bajo_cc
               WHEN s.precio_alto_cc IS NOT NULL AND c.cilindraje > 150 THEN s.precio_alto_cc
               ELSE s.precio
             END as monto,
             'Servicios' as categoria,
             NULL as registrado_por
      FROM citas c
      LEFT JOIN servicios s ON c.servicio = s.nombre
      WHERE c.estado = 'completada' 
        AND strftime('%Y-%m', c.fecha) = ?
        AND c.taller_id IS NULL
      ORDER BY c.fecha DESC
    `, [`${anioActual}-${mesActual}`]);

    // Combinar y ordenar todos los movimientos
    const movimientos = [...gastos, ...ingresosProductos, ...ingresosServicios].sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    res.json(movimientos);
  } catch (error) {
    console.error("❌ Error obteniendo movimientos:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
