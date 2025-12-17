// backend/routes/nomina.js - PLACEHOLDER (se implementará después)
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
  try {
    db = await open({
      filename: path.join(__dirname, "../database/database.sqlite"),
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.error("Error inicializando DB en nomina:", e.message);
  }
})();

// GET /api/nomina - Retorna reporte de nómina
router.get("/", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const now = new Date();
    const primerDiaDelMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicio = fechaInicio || primerDiaDelMes.toISOString().split('T')[0];
    const fin = fechaFin || now.toISOString().split('T')[0];

    // Obtener lavadores
    let lavadores = [];
    try {
      lavadores = await db.all("SELECT * FROM lavadores WHERE activo = 1 ORDER BY nombre");
    } catch (e) {
      console.error("Error obteniendo lavadores:", e.message);
      lavadores = [];
    }

    // Obtener citas con lavador asignado (cualquier estado)
    let citas = [];
    try {
      citas = await db.all(`
        SELECT c.* FROM citas c
        WHERE c.lavador_id IS NOT NULL
          AND c.fecha >= ?
          AND c.fecha <= ?
        ORDER BY c.fecha, c.hora
      `, [inicio, fin]);
    } catch (e) {
      console.error("Error obteniendo citas:", e.message);
      citas = [];
    }

    // Agrupar citas por lavador y calcular comisión
    const reportePorLavador = lavadores.map(lavador => {
      const citasLavador = citas.filter(c => c.lavador_id === lavador.id);
      const totalBase = citasLavador.reduce((sum, c) => sum + (Number(c.precio) || 25000), 0);
      const comision = totalBase * (lavador.comision_porcentaje / 100);

      return {
        lavador_id: lavador.id,
        nombre: lavador.nombre,
        cedula: lavador.cedula || '',
        comision_porcentaje: lavador.comision_porcentaje,
        cantidad_servicios: citasLavador.length,
        ingreso_cliente: totalBase,
        total_generado: totalBase,
        comision_a_pagar: comision
      };
    });

    const totalServicios = citas.length;
    const totalIngresos = reportePorLavador.reduce((sum, l) => sum + l.total_generado, 0);
    const totalNomina = reportePorLavador.reduce((sum, l) => sum + l.comision_a_pagar, 0);

    // Calcular métodos de pago
    const metodosCount = {
      codigo_qr: citas.filter(c => c.metodo_pago === 'codigo_qr').length,
      efectivo: citas.filter(c => c.metodo_pago === 'efectivo').length,
      tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').length
    };

    const ingresosMetodos = {
      codigo_qr: citas.filter(c => c.metodo_pago === 'codigo_qr').reduce((sum, c) => sum + (Number(c.precio) || 25000), 0),
      efectivo: citas.filter(c => c.metodo_pago === 'efectivo').reduce((sum, c) => sum + (Number(c.precio) || 25000), 0),
      tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').reduce((sum, c) => sum + (Number(c.precio) || 25000), 0)
    };

    res.json({
      periodo: { fecha_inicio: inicio, fecha_fin: fin },
      resumen: {
        total_servicios: totalServicios,
        total_ingresos_cliente: totalIngresos,
        total_ingresos_comision_base: totalIngresos,
        total_nomina: totalNomina,
        ganancia_neta: totalIngresos - totalNomina,
        margen_porcentaje: totalIngresos > 0 ? (((totalIngresos - totalNomina) / totalIngresos) * 100).toFixed(2) : 0,
        metodos_pago: metodosCount,
        ingresos_metodos: ingresosMetodos
      },
      lavadores: reportePorLavador,
      servicios: []
    });
  } catch (error) {
    console.error("Error en GET /api/nomina:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/nomina/exportar-excel - Placeholder
router.get("/exportar-excel", async (req, res) => {
  try {
    res.json({
      periodo: { fecha_inicio: "", fecha_fin: "" },
      resumen: {
        total_servicios: 0,
        total_nomina: 0
      },
      lavadores: [],
      servicios: []
    });
  } catch (error) {
    console.error("Error en GET /api/nomina/exportar-excel:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
