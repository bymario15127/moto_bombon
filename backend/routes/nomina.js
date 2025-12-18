// backend/routes/nomina.js - Reporte de nómina y métodos de pago
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

// Helpers de precio
const ccIsBajo = (cc) => {
  const n = Number(cc || 0);
  return !Number.isNaN(n) && n >= 50 && n <= 405; // alineado con reportes
};
const ccIsAlto = (cc) => {
  const n = Number(cc || 0);
  return !Number.isNaN(n) && n > 405;
};
const normalize = (s) => String(s || '').trim().toLowerCase();

function calcularPrecioCliente(cita, ctx) {
  // ctx: { serviciosByNombre, promocionesById, talleresById }
  const cc = cita.cilindraje;
  // Promoción
  if (cita.promocion_id) {
    const p = ctx.promocionesById.get(cita.promocion_id);
    if (p) {
      if (ccIsBajo(cc)) return Number(p.precio_cliente_bajo_cc) || 0;
      if (ccIsAlto(cc)) return Number(p.precio_cliente_alto_cc) || 0;
      return Number(p.precio_cliente_bajo_cc || p.precio_cliente_alto_cc || 0);
    }
  }
  // Taller (si aplica)
  if (cita.taller_id) {
    const t = ctx.talleresById.get(cita.taller_id);
    if (t) {
      if (ccIsBajo(cc)) return Number(t.precio_bajo_cc) || 0;
      if (ccIsAlto(cc)) return Number(t.precio_alto_cc) || 0;
      return Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
    }
  }
  // Servicio normal
  const s = ctx.serviciosByNombre.get(normalize(cita.servicio));
  if (s) {
    if (ccIsBajo(cc)) return Number(s.precio_bajo_cc ?? s.precio ?? 0) || 0;
    if (ccIsAlto(cc)) return Number(s.precio_alto_cc ?? s.precio ?? 0) || 0;
    return Number(s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
  }
  // Fallback histórico
  return 25000;
}

function calcularBaseComision(cita, ctx) {
  // Promociones tienen precio de comisión específico
  const cc = cita.cilindraje;
  if (cita.promocion_id) {
    const p = ctx.promocionesById.get(cita.promocion_id);
    if (p) {
      if (ccIsBajo(cc)) return Number(p.precio_comision_bajo_cc) || 0;
      if (ccIsAlto(cc)) return Number(p.precio_comision_alto_cc) || 0;
      return Number(p.precio_comision_bajo_cc || p.precio_comision_alto_cc || 0);
    }
  }
  // Talleres: usan sus precios como base (si no hay lógica diferente)
  if (cita.taller_id) {
    const t = ctx.talleresById.get(cita.taller_id);
    if (t) {
      if (ccIsBajo(cc)) return Number(t.precio_bajo_cc) || 0;
      if (ccIsAlto(cc)) return Number(t.precio_alto_cc) || 0;
      return Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
    }
  }
  // Servicio normal: usar precio_base_comision_* si existe, si no el precio cliente
  const s = ctx.serviciosByNombre.get(normalize(cita.servicio));
  if (s) {
    if (ccIsBajo(cc)) return Number(s.precio_base_comision_bajo ?? s.precio_bajo_cc ?? s.precio ?? 0) || 0;
    if (ccIsAlto(cc)) return Number(s.precio_base_comision_alto ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
    return Number(
      s.precio_base_comision_bajo ?? s.precio_base_comision_alto ?? s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0
    ) || 0;
  }
  return 25000;
}

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
          AND COALESCE(c.estado,'') IN ('finalizada','confirmada')
        ORDER BY c.fecha, c.hora
      `, [inicio, fin]);
    } catch (e) {
      console.error("Error obteniendo citas:", e.message);
      citas = [];
    }

    // Contexto de precios: servicios, promociones, talleres
    const servicios = await (async () => {
      try { return await db.all("SELECT * FROM servicios"); } catch (_) { return []; }
    })();
    const promociones = await (async () => {
      try { return await db.all("SELECT * FROM promociones"); } catch (_) { return []; }
    })();
    const talleres = await (async () => {
      try { return await db.all("SELECT * FROM talleres"); } catch (_) { return []; }
    })();

    const serviciosByNombre = new Map(servicios.map(s => [normalize(s.nombre), s]));
    const promocionesById = new Map(promociones.map(p => [p.id, p]));
    const talleresById = new Map(talleres.map(t => [t.id, t]));

    const ctx = { serviciosByNombre, promocionesById, talleresById };

    // Agrupar citas por lavador y calcular comisión
    const reportePorLavador = lavadores.map(lavador => {
      const citasLavador = citas.filter(c => c.lavador_id === lavador.id);
      const ingresoCliente = citasLavador.reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0);
      const baseComision = citasLavador.reduce((sum, c) => sum + calcularBaseComision(c, ctx), 0);
      const comision = baseComision * ((Number(lavador.comision_porcentaje) || 0) / 100);

      return {
        lavador_id: lavador.id,
        nombre: lavador.nombre,
        cedula: lavador.cedula || '',
        comision_porcentaje: lavador.comision_porcentaje,
        cantidad_servicios: citasLavador.length,
        ingreso_cliente: ingresoCliente,
        total_generado: ingresoCliente,
        comision_a_pagar: comision
      };
    });

    const totalServicios = citas.length;
    const totalIngresos = reportePorLavador.reduce((sum, l) => sum + l.total_generado, 0);
    const totalNomina = reportePorLavador.reduce((sum, l) => sum + l.comision_a_pagar, 0);
    const totalBaseComision = citas.reduce((sum, c) => sum + calcularBaseComision(c, ctx), 0);

    // Resumen por tipo de servicio
    const serviciosMap = new Map();
    for (const c of citas) {
      const nombreServ = normalize(c.servicio);
      if (!nombreServ) continue;
      const ingreso = calcularPrecioCliente(c, ctx);
      const item = serviciosMap.get(nombreServ) || { servicio: c.servicio, cantidad: 0, ingreso_total: 0 };
      item.cantidad += 1;
      item.ingreso_total += ingreso;
      serviciosMap.set(nombreServ, item);
    }
    const serviciosResumen = Array.from(serviciosMap.values())
      .map(s => ({
        servicio: s.servicio,
        cantidad: s.cantidad,
        ingreso_total: s.ingreso_total,
        porcentaje: totalServicios > 0 ? ((s.cantidad / totalServicios) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.ingreso_total - a.ingreso_total);

    // Calcular métodos de pago
    const metodosCount = {
      codigo_qr: citas.filter(c => c.metodo_pago === 'codigo_qr').length,
      efectivo: citas.filter(c => c.metodo_pago === 'efectivo').length,
      tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').length
    };

    const ingresosMetodos = {
      codigo_qr: citas.filter(c => c.metodo_pago === 'codigo_qr').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0),
      efectivo: citas.filter(c => c.metodo_pago === 'efectivo').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0),
      tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0)
    };

    res.json({
      periodo: { fecha_inicio: inicio, fecha_fin: fin },
      resumen: {
        total_servicios: totalServicios,
        total_ingresos_cliente: totalIngresos,
        total_ingresos_comision_base: totalBaseComision,
        total_nomina: totalNomina,
        ganancia_neta: totalIngresos - totalNomina,
        margen_porcentaje: totalIngresos > 0 ? (((totalIngresos - totalNomina) / totalIngresos) * 100).toFixed(2) : 0,
        metodos_pago: metodosCount,
        ingresos_metodos: ingresosMetodos
      },
      lavadores: reportePorLavador,
      servicios: serviciosResumen
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
