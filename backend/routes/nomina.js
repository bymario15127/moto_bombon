// backend/routes/nomina.js
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from 'xlsx';

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

// GET /api/nomina?fechaInicio=2025-12-01&fechaFin=2025-12-15
router.get("/", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    // Si no se especifica, usar desde el primer día del mes hasta hoy
    const now = new Date();
    const primerDiaDelMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicio = fechaInicio || primerDiaDelMes.toISOString().split('T')[0];
    const fin = fechaFin || now.toISOString().split('T')[0];
    
    // Obtener todos los lavadores activos
    const lavadores = await db.all("SELECT * FROM lavadores WHERE activo = 1 ORDER BY nombre");
    
    // Obtener citas finalizadas O confirmadas del rango de fechas con información del servicio, promoción y taller
    const citasFinalizadas = await db.all(`
      SELECT 
        c.*,
        s.precio as precio_servicio,
        s.precio_bajo_cc,
        s.precio_alto_cc,
        p.precio_cliente_bajo_cc as promo_precio_cliente_bajo_cc,
        p.precio_cliente_alto_cc as promo_precio_cliente_alto_cc,
        p.precio_comision_bajo_cc as promo_precio_comision_bajo_cc,
        p.precio_comision_alto_cc as promo_precio_comision_alto_cc,
        t.precio_bajo_cc as taller_precio_bajo_cc,
        t.precio_alto_cc as taller_precio_alto_cc,
        l.nombre as lavador_nombre,
        l.comision_porcentaje
      FROM citas c
      LEFT JOIN servicios s ON s.nombre = c.servicio
      LEFT JOIN promociones p ON p.id = c.promocion_id
      LEFT JOIN talleres t ON t.id = c.taller_id
      LEFT JOIN lavadores l ON l.id = c.lavador_id
      WHERE c.estado IN ('finalizada', 'confirmada')
        AND c.fecha >= ?
        AND c.fecha <= ?
        AND c.lavador_id IS NOT NULL
      ORDER BY c.fecha, c.hora
    `, [inicio, fin]);
    
    // Calcular estadísticas por lavador
    const reportePorLavador = lavadores.map(lavador => {
      const citasDelLavador = citasFinalizadas.filter(c => c.lavador_id === lavador.id);
      
      let totalGenerado = 0;
      let totalIngresoCliente = 0; // Lo que realmente pagó el cliente
      citasDelLavador.forEach(cita => {
        // Determinar el precio según si es taller, promoción o cliente
        let precio = 0;
        let precioCliente = 0; // Lo que pagó el cliente
        
        console.log(`\n🔍 Cita ${cita.id} (${cita.servicio}, CC:${cita.cilindraje}): promo_id=${cita.promocion_id}, promo_bajo=${cita.promo_precio_comision_bajo_cc}, promo_alto=${cita.promo_precio_comision_alto_cc}`);
        
        // PRIORIDAD 1: Si es una promoción, usar los precios de comisión de la promoción
        if (cita.promocion_id && cita.promo_precio_comision_bajo_cc && cita.promo_precio_comision_alto_cc) {
          const cc = parseInt(cita.cilindraje);
          if (cc >= 100 && cc <= 405) {
            precio = cita.promo_precio_comision_bajo_cc;
            precioCliente = cita.promo_precio_cliente_bajo_cc || cita.promo_precio_comision_bajo_cc;
            console.log(`  ✅ PROMOCIÓN BAJO CC: $${precio} (cliente: $${precioCliente})`);
          } else if (cc > 405 && cc <= 1200) {
            precio = cita.promo_precio_comision_alto_cc;
            precioCliente = cita.promo_precio_cliente_alto_cc || cita.promo_precio_comision_alto_cc;
            console.log(`  ✅ PROMOCIÓN ALTO CC: $${precio} (cliente: $${precioCliente})`);
          } else {
            console.log(`  ⚠️ CC fuera de rango: ${cc}`);
          }
        }
        // PRIORIDAD 2: Si es un taller aliado, usar los precios del taller
        else if (cita.tipo_cliente === 'taller' && cita.taller_precio_bajo_cc && cita.taller_precio_alto_cc) {
          const cc = parseInt(cita.cilindraje);
          if (cc >= 50 && cc <= 405) {
            precio = cita.taller_precio_bajo_cc;
            precioCliente = precio;
            console.log(`  ✅ TALLER BAJO CC: $${precio}`);
          } else if (cc > 405 && cc <= 1200) {
            precio = cita.taller_precio_alto_cc;
            precioCliente = precio;
            console.log(`  ✅ TALLER ALTO CC: $${precio}`);
          }
        }
        // PRIORIDAD 3: Si es un cliente regular, usar los precios del servicio
        else if (cita.precio_bajo_cc && cita.precio_alto_cc) {
          const cc = parseInt(cita.cilindraje);
          if (cc >= 100 && cc <= 405) {
            precio = cita.precio_bajo_cc;
            precioCliente = precio;
            console.log(`  ✅ SERVICIO BAJO CC: $${precio}`);
          } else if (cc > 405 && cc <= 1200) {
            precio = cita.precio_alto_cc;
            precioCliente = precio;
            console.log(`  ✅ SERVICIO ALTO CC: $${precio}`);
          }
        }
        // Fallback: usar el precio del servicio
        else {
          precio = cita.precio_servicio || 0;
          precioCliente = precio;
          console.log(`  ⚠️ FALLBACK PRECIO: $${precio}`);
        }
        console.log(`  📊 Total parcial: ingreso=$${totalIngresoCliente} + $${precioCliente}, comisión=$${totalGenerado} + $${precio}`);
        totalGenerado += precio;
        totalIngresoCliente += precioCliente;
      });
      
      const comision = totalGenerado * (lavador.comision_porcentaje / 100);
      
      return {
        lavador_id: lavador.id,
        nombre: lavador.nombre,
        cedula: lavador.cedula,
        comision_porcentaje: lavador.comision_porcentaje,
        cantidad_servicios: citasDelLavador.length,
        total_ingreso_cliente: totalIngresoCliente,
        total_generado: totalGenerado,
        comision_a_pagar: comision,
        citas: citasDelLavador
      };
    });
    
    // Calcular totales generales (separar ingreso real vs base de comisión)
    const totalServicios = citasFinalizadas.length;
    const totalIngresosCliente = reportePorLavador.reduce((sum, l) => sum + l.ingreso_cliente, 0);
    const totalIngresos = reportePorLavador.reduce((sum, l) => sum + l.total_generado, 0);
    const totalNomina = reportePorLavador.reduce((sum, l) => sum + l.comision_a_pagar, 0);
    const gananciaNeta = totalIngresos - totalNomina;
    
    // Estadísticas por tipo de servicio
    const serviciosUnicos = [...new Set(citasFinalizadas.map(c => c.servicio))];
    const estadisticasPorServicio = serviciosUnicos.map(servicio => {
      const citasDelServicio = citasFinalizadas.filter(c => c.servicio === servicio);

      const ingresoCliente = citasDelServicio.reduce((sum, c) => {
        let precioCliente = 0;

        if (c.promocion_id && c.promo_precio_comision_bajo_cc && c.promo_precio_comision_alto_cc) {
          const cc = parseInt(c.cilindraje);
          if (cc >= 100 && cc <= 405) {
            precioCliente = c.promo_precio_cliente_bajo_cc || c.promo_precio_comision_bajo_cc;
          } else if (cc > 405 && cc <= 1200) {
            precioCliente = c.promo_precio_cliente_alto_cc || c.promo_precio_comision_alto_cc;
          }
        } else if (c.tipo_cliente === 'taller' && c.taller_precio_bajo_cc && c.taller_precio_alto_cc) {
          const cc = parseInt(c.cilindraje);
          if (cc >= 50 && cc <= 405) {
            precioCliente = c.taller_precio_bajo_cc;
          } else if (cc > 405 && cc <= 1200) {
            precioCliente = c.taller_precio_alto_cc;
          }
        } else if (c.precio_bajo_cc && c.precio_alto_cc) {
          const cc = parseInt(c.cilindraje);
          if (cc >= 100 && cc <= 405) {
            precioCliente = c.precio_bajo_cc;
          } else if (cc > 405 && cc <= 1200) {
            precioCliente = c.precio_alto_cc;
          }
        } else {
          precioCliente = c.precio_servicio || 0;
        }
        return sum + precioCliente;
      }, 0);

      const ingresoBaseComision = citasDelServicio.reduce((sum, c) => {
        let precio = 0;

        if (c.promocion_id && c.promo_precio_comision_bajo_cc && c.promo_precio_comision_alto_cc) {
          const cc = parseInt(c.cilindraje);
          if (cc >= 100 && cc <= 405) {
            precio = c.promo_precio_comision_bajo_cc;
          } else if (cc > 405 && cc <= 1200) {
            precio = c.promo_precio_comision_alto_cc;
          }
        } else if (c.tipo_cliente === 'taller' && c.taller_precio_bajo_cc && c.taller_precio_alto_cc) {
          const cc = parseInt(c.cilindraje);
          if (cc >= 50 && cc <= 405) {
            precio = c.taller_precio_bajo_cc;
          } else if (cc > 405 && cc <= 1200) {
            precio = c.taller_precio_alto_cc;
          }
        } else if (c.precio_bajo_cc && c.precio_alto_cc) {
          const cc = parseInt(c.cilindraje);
          if (cc >= 100 && cc <= 405) {
            precio = c.precio_bajo_cc;
          } else if (cc > 405 && cc <= 1200) {
            precio = c.precio_alto_cc;
          }
        } else {
          precio = c.precio_servicio || 0;
        }
        return sum + precio;
      }, 0);
      
      return {
        servicio,
        cantidad: citasDelServicio.length,
        ingreso_total: ingresoCliente,
        ingreso_cliente: ingresoCliente,
        ingreso_comision_base: ingresoBaseComision,
        porcentaje: totalIngresosCliente > 0 ? ((ingresoCliente / totalIngresosCliente) * 100).toFixed(2) : 0
      };
    });
    
    res.json({
      periodo: {
        fecha_inicio: inicio,
        fecha_fin: fin
      },
      resumen: {
        total_servicios: totalServicios,
        total_ingresos_cliente: totalIngresosCliente,
        total_ingresos_comision_base: totalIngresos,
        total_nomina: totalNomina,
        ganancia_neta: gananciaNeta,
        margen_porcentaje: totalIngresosCliente > 0 ? ((gananciaNeta / totalIngresosCliente) * 100).toFixed(2) : 0
      },
      lavadores: reportePorLavador,
      servicios: estadisticasPorServicio
    });
    
  } catch (error) {
    console.error("Error al generar reporte de nómina:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/nomina/exportar-excel?fechaInicio=2025-12-01&fechaFin=2025-12-15
router.get("/exportar-excel", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const now = new Date();
    const primerDiaDelMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicio = fechaInicio || primerDiaDelMes.toISOString().split('T')[0];
    const fin = fechaFin || now.toISOString().split('T')[0];
    
    // Reutilizar la lógica del endpoint GET /
    const lavadores = await db.all("SELECT * FROM lavadores WHERE activo = 1 ORDER BY nombre");
    
    const citasFinalizadas = await db.all(`
      SELECT 
        c.*,
        s.precio as precio_servicio,
        s.precio_bajo_cc,
        s.precio_alto_cc,
        p.precio_cliente_bajo_cc as promo_precio_cliente_bajo_cc,
        p.precio_cliente_alto_cc as promo_precio_cliente_alto_cc,
        p.precio_comision_bajo_cc as promo_precio_comision_bajo_cc,
        p.precio_comision_alto_cc as promo_precio_comision_alto_cc,
        t.precio_bajo_cc as taller_precio_bajo_cc,
        t.precio_alto_cc as taller_precio_alto_cc,
        l.nombre as lavador_nombre,
        l.comision_porcentaje
      FROM citas c
      LEFT JOIN servicios s ON s.nombre = c.servicio
      LEFT JOIN promociones p ON p.id = c.promocion_id
      LEFT JOIN talleres t ON t.id = c.taller_id
      LEFT JOIN lavadores l ON l.id = c.lavador_id
      WHERE c.estado IN ('finalizada', 'confirmada')
        AND c.fecha >= ?
        AND c.fecha <= ?
        AND c.lavador_id IS NOT NULL
      ORDER BY c.fecha, c.hora
    `, [inicio, fin]);
    
    const reportePorLavador = lavadores.map(lavador => {
      const citasDelLavador = citasFinalizadas.filter(c => c.lavador_id === lavador.id);
      
      let totalGenerado = 0;
      let totalIngresoCliente = 0;
      citasDelLavador.forEach(cita => {
        // Calcular precio de comisión (base comisión)
        const precioComision = calcularPrecioBase(cita);
        totalGenerado += precioComision;
        
        // Calcular ingreso cliente (lo que realmente paga)
        let precioCliente = 0;
        const cc = parseInt(cita.cilindraje || 0);
        
        if (cita.promocion_id && cita.promo_precio_cliente_bajo_cc && cita.promo_precio_cliente_alto_cc) {
          if (cc >= 50 && cc <= 405) precioCliente = cita.promo_precio_cliente_bajo_cc;
          else if (cc > 405) precioCliente = cita.promo_precio_cliente_alto_cc;
        }
        else if (cita.tipo_cliente === 'taller') {
          precioCliente = precioComision; // Para taller, ingreso cliente = comisión
        }
        else if (cita.precio_bajo_cc && cita.precio_alto_cc) {
          if (cc >= 50 && cc <= 405) precioCliente = cita.precio_bajo_cc;
          else if (cc > 405) precioCliente = cita.precio_alto_cc;
        }
        else {
          precioCliente = cita.precio_servicio || 0;
        }
        
        totalIngresoCliente += precioCliente;
      });
      
      const comision = totalGenerado * (lavador.comision_porcentaje / 100);
      
      return {
        lavador_id: lavador.id,
        nombre: lavador.nombre,
        cedula: lavador.cedula,
        comision_porcentaje: lavador.comision_porcentaje,
        cantidad_servicios: citasDelLavador.length,
        ingreso_cliente: totalIngresoCliente,
        total_generado: totalGenerado,
        comision_a_pagar: comision
      };
    });
    
    const totalServicios = citasFinalizadas.length;
    const totalIngresosCliente = reportePorLavador.reduce((sum, l) => sum + l.ingreso_cliente, 0);
    const totalIngresos = reportePorLavador.reduce((sum, l) => sum + l.total_generado, 0);
    const totalNomina = reportePorLavador.reduce((sum, l) => sum + l.comision_a_pagar, 0);
    const gananciaNeta = totalIngresos - totalNomina;
    
    const serviciosUnicos = [...new Set(citasFinalizadas.map(c => c.servicio))];
    const estadisticasPorServicio = serviciosUnicos.map(servicio => {
      const citasDelServicio = citasFinalizadas.filter(c => c.servicio === servicio);
      const ingreso = citasDelServicio.reduce((sum, c) => sum + calcularPrecioBase(c), 0);
      
      return {
        servicio,
        cantidad: citasDelServicio.length,
        ingreso_total: ingreso,
        porcentaje: totalIngresos > 0 ? ((ingreso / totalIngresos) * 100).toFixed(2) : 0
      };
    });
    
    // Crear el libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // HOJA 1: Resumen General
    const resumenData = [
      ['REPORTE DE NÓMINA - MOTOBOMBON'],
      [`Período: Del ${inicio} al ${fin}`],
      [],
      ['RESUMEN FINANCIERO'],
      ['Total de Servicios', totalServicios],
      ['Ingreso Cliente (Total Facturado)', `$${totalIngresosCliente.toLocaleString('es-CO')}`],
      ['Base para Comisión', `$${totalIngresos.toLocaleString('es-CO')}`],
      ['Total Nómina a Pagar', `$${totalNomina.toLocaleString('es-CO')}`],
      ['Ganancia Neta', `$${gananciaNeta.toLocaleString('es-CO')}`],
      ['Margen de Ganancia', `${totalIngresos > 0 ? ((gananciaNeta / totalIngresos) * 100).toFixed(2) : 0}%`],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen General');
    
    // HOJA 2: Nómina Detallada
    const nominaData = [
      ['Lavador', 'Cédula', 'Servicios', 'Ingreso Cliente', 'Base Comisión', '% Comisión', 'A Pagar']
    ];
    reportePorLavador.forEach(lav => {
      nominaData.push([
        lav.nombre,
        lav.cedula || 'N/A',
        lav.cantidad_servicios,
        `$${lav.ingreso_cliente.toLocaleString('es-CO')}`,
        `$${lav.total_generado.toLocaleString('es-CO')}`,
        `${lav.comision_porcentaje}%`,
        `$${lav.comision_a_pagar.toLocaleString('es-CO')}`
      ]);
    });
    nominaData.push([]);
    nominaData.push(['TOTAL', '', totalServicios, `$${totalIngresosCliente.toLocaleString('es-CO')}`, `$${totalIngresos.toLocaleString('es-CO')}`, '', `$${totalNomina.toLocaleString('es-CO')}`]);
    
    const wsNomina = XLSX.utils.aoa_to_sheet(nominaData);
    XLSX.utils.book_append_sheet(workbook, wsNomina, 'Nómina Detallada');
    
    // HOJA 3: Ingresos por Servicio
    const serviciosData = [
      ['Servicio', 'Cantidad', 'Ingreso Total', '% del Total']
    ];
    estadisticasPorServicio.forEach(srv => {
      serviciosData.push([
        srv.servicio,
        srv.cantidad,
        `$${srv.ingreso_total.toLocaleString('es-CO')}`,
        `${srv.porcentaje}%`
      ]);
    });
    
    const wsServicios = XLSX.utils.aoa_to_sheet(serviciosData);
    XLSX.utils.book_append_sheet(workbook, wsServicios, 'Ingresos por Servicio');

    // HOJA 4: Ingresos por Promoción (resumen depurado)
    const promos = citasFinalizadas.filter(c => c.promocion_id);
    const agg = {};
    promos.forEach(c => {
      const nombre = c.servicio || c.promo_nombre || 'Promoción';
      const cc = parseInt(c.cilindraje || 0);
      let cliente = 0, base = 0;
      if (c.promo_precio_cliente_bajo_cc || c.promo_precio_cliente_alto_cc) {
        if (cc >= 50 && cc <= 405) {
          cliente = c.promo_precio_cliente_bajo_cc || 0;
          base = c.promo_precio_comision_bajo_cc || 0;
        } else if (cc > 405) {
          cliente = c.promo_precio_cliente_alto_cc || 0;
          base = c.promo_precio_comision_alto_cc || 0;
        } else {
          cliente = c.promo_precio_cliente_bajo_cc || c.promo_precio_cliente_alto_cc || 0;
          base = c.promo_precio_comision_bajo_cc || c.promo_precio_comision_alto_cc || 0;
        }
      }
      if (!agg[nombre]) {
        agg[nombre] = { cantidad: 0, totalCliente: 0, totalBase: 0 };
      }
      agg[nombre].cantidad += 1;
      agg[nombre].totalCliente += Number(cliente) || 0;
      agg[nombre].totalBase += Number(base) || 0;
    });

    const promocionesData = [ ['Promoción', 'Cantidad', 'Total Cliente', 'Total Base Comisión'] ];
    Object.entries(agg).forEach(([nombre, vals]) => {
      promocionesData.push([
        nombre,
        vals.cantidad,
        `$${Number(vals.totalCliente).toLocaleString('es-CO')}`,
        `$${Number(vals.totalBase).toLocaleString('es-CO')}`,
      ]);
    });
    const wsPromos = XLSX.utils.aoa_to_sheet(promocionesData);
    XLSX.utils.book_append_sheet(workbook, wsPromos, 'Ingresos por Promoción');
    
    // Generar el archivo Excel en formato buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Enviar como descarga
    const nombreArchivo = `Nomina_${inicio}_${fin}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
    
  } catch (error) {
    console.error("Error al generar Excel:", error);
    res.status(500).json({ error: "Error al generar archivo Excel" });
  }
});

export default router;

// Función helper para calcular precio base comisión (reutilizable en GET y Excel export)
function calcularPrecioBase(cita) {
  let precio = 0;
  const cc = parseInt(cita.cilindraje || 0);
  
  // PRIORIDAD 1: Si es una promoción
  if (cita.promocion_id && cita.promo_precio_comision_bajo_cc && cita.promo_precio_comision_alto_cc) {
    if (cc >= 50 && cc <= 405) {
      precio = cita.promo_precio_comision_bajo_cc;
    } else if (cc > 405) {
      precio = cita.promo_precio_comision_alto_cc;
    }
  }
  // PRIORIDAD 2: Si es taller
  else if (cita.tipo_cliente === 'taller' && cita.taller_precio_bajo_cc && cita.taller_precio_alto_cc) {
    if (cc >= 50 && cc <= 405) {
      precio = cita.taller_precio_bajo_cc;
    } else if (cc > 405) {
      precio = cita.taller_precio_alto_cc;
    }
  }
  // PRIORIDAD 3: Cliente regular con servicio
  else if (cita.precio_bajo_cc && cita.precio_alto_cc) {
    if (cc >= 50 && cc <= 405) {
      precio = cita.precio_bajo_cc;
    } else if (cc > 405) {
      precio = cita.precio_alto_cc;
    }
  }
  // Fallback
  else {
    precio = cita.precio_servicio || 0;
  }
  
  return Number(precio) || 0;
}
