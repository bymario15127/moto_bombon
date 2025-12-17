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

// GET /api/nomina - Retorna reporte vacío para ahora
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const primerDiaDelMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicio = primerDiaDelMes.toISOString().split('T')[0];
    const fin = now.toISOString().split('T')[0];

    res.json({
      periodo: { fecha_inicio: inicio, fecha_fin: fin },
      resumen: {
        total_servicios: 0,
        total_ingresos_cliente: 0,
        total_ingresos_comision_base: 0,
        total_nomina: 0,
        ganancia_neta: 0,
        margen_porcentaje: 0
      },
      lavadores: [],
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
