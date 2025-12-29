// backend/database/updateGoldNavidenoExistentes.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateExistingGoldNavideno() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔄 Actualizando citas de GOLD NAVIDEÑO existentes...\n");

    // Obtener el ID de la promoción GOLD NAVIDEÑO
    const promocion = await db.get(
      "SELECT id FROM promociones WHERE nombre = 'GOLD NAVIDEÑO'"
    );

    if (!promocion) {
      console.log("❌ No se encontró la promoción 'GOLD NAVIDEÑO'");
      console.log("   Ejecuta primero: node database/createPromociones.js");
      return;
    }

    console.log(`✅ Promoción encontrada (ID: ${promocion.id})\n`);

    // Buscar citas con servicio GOLD NAVIDEÑO de los últimos 30 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const citasGoldNavideno = await db.all(`
      SELECT id, fecha, cliente, cilindraje, estado, servicio
      FROM citas 
      WHERE servicio = 'GOLD NAVIDEÑO'
        AND fecha >= ?
        AND promocion_id IS NULL
      ORDER BY fecha DESC
    `, [fechaLimiteStr]);

    if (citasGoldNavideno.length === 0) {
      console.log("ℹ️  No se encontraron citas de GOLD NAVIDEÑO sin actualizar");
      return;
    }

    console.log(`📋 Encontradas ${citasGoldNavideno.length} citas de GOLD NAVIDEÑO para actualizar:\n`);
    
    // Mostrar resumen
    citasGoldNavideno.forEach((cita, index) => {
      console.log(`   ${index + 1}. Fecha: ${cita.fecha} | Cliente: ${cita.cliente} | Estado: ${cita.estado} | CC: ${cita.cilindraje}`);
    });

    console.log(`\n🔄 Actualizando promocion_id a ${promocion.id}...\n`);

    // Actualizar todas las citas
    const result = await db.run(`
      UPDATE citas 
      SET promocion_id = ?
      WHERE servicio = 'GOLD NAVIDEÑO'
        AND fecha >= ?
        AND promocion_id IS NULL
    `, [promocion.id, fechaLimiteStr]);

    console.log(`✅ ${result.changes} citas actualizadas exitosamente\n`);

    // Verificar actualización
    const citasVerificadas = await db.all(`
      SELECT 
        c.id, 
        c.fecha, 
        c.cliente, 
        c.estado,
        c.cilindraje,
        p.nombre as promocion_nombre,
        p.precio_cliente_bajo_cc,
        p.precio_cliente_alto_cc,
        p.precio_comision_bajo_cc,
        p.precio_comision_alto_cc
      FROM citas c
      JOIN promociones p ON p.id = c.promocion_id
      WHERE c.servicio = 'GOLD NAVIDEÑO'
        AND c.fecha >= ?
      ORDER BY c.fecha DESC
      LIMIT 5
    `, [fechaLimiteStr]);

    if (citasVerificadas.length > 0) {
      console.log("✅ Verificación (últimas 5 citas):");
      citasVerificadas.forEach(cita => {
        const cc = parseInt(cita.cilindraje);
        const precioCliente = cc <= 405 ? cita.precio_cliente_bajo_cc : cita.precio_cliente_alto_cc;
        const precioComision = cc <= 405 ? cita.precio_comision_bajo_cc : cita.precio_comision_alto_cc;
        
        console.log(`   - ${cita.fecha} | ${cita.cliente} (${cita.cilindraje}cc)`);
        console.log(`     Cliente paga: $${precioCliente?.toLocaleString('es-CO') || 'N/A'}`);
        console.log(`     Comisión sobre: $${precioComision?.toLocaleString('es-CO') || 'N/A'}`);
      });
    }

    console.log("\n🎉 Actualización completada!");
    console.log("💰 Las comisiones de nómina ahora se calcularán correctamente.");

  } catch (error) {
    console.error("❌ Error durante la actualización:", error);
    throw error;
  } finally {
    await db.close();
  }
}

updateExistingGoldNavideno().catch(console.error);
