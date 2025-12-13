// backend/database/migrarGoldNavidenoAPromocion.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrarGoldNavideno() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔄 Migrando GOLD NAVIDEÑO de servicio a promoción...\n");

    // 1. Verificar que existe la promoción GOLD NAVIDEÑO
    const promocion = await db.get(
      "SELECT id FROM promociones WHERE nombre = 'GOLD NAVIDEÑO'"
    );

    if (!promocion) {
      console.log("❌ No se encontró la promoción 'GOLD NAVIDEÑO'");
      console.log("   Primero ejecuta: node database/createPromociones.js");
      return;
    }

    console.log(`✅ Promoción GOLD NAVIDEÑO encontrada (ID: ${promocion.id})\n`);

    // 2. Buscar todas las citas con servicio "GOLD NAVIDEÑO" (incluyendo variaciones)
    const citasGoldNavideno = await db.all(`
      SELECT id, fecha, cliente, servicio, estado 
      FROM citas 
      WHERE (servicio LIKE '%GOLD%NAVIDE%' OR servicio LIKE '%gold%navide%')
        AND promocion_id IS NULL
      ORDER BY fecha DESC
    `);

    if (citasGoldNavideno.length === 0) {
      console.log("ℹ️  No hay citas de GOLD NAVIDEÑO para migrar");
    } else {
      console.log(`📋 Encontradas ${citasGoldNavideno.length} citas de GOLD NAVIDEÑO:\n`);
      
      citasGoldNavideno.forEach((cita, index) => {
        console.log(`   ${index + 1}. ID: ${cita.id} | Fecha: ${cita.fecha} | Cliente: ${cita.cliente} | Servicio: "${cita.servicio}" | Estado: ${cita.estado}`);
      });

      console.log(`\n🔄 Actualizando promocion_id a ${promocion.id}...\n`);

      // Actualizar todas las citas
      const result = await db.run(`
        UPDATE citas 
        SET promocion_id = ?, servicio = 'GOLD NAVIDEÑO'
        WHERE (servicio LIKE '%GOLD%NAVIDE%' OR servicio LIKE '%gold%navide%')
          AND promocion_id IS NULL
      `, [promocion.id]);

      console.log(`✅ ${result.changes} citas actualizadas\n`);
    }

    // 3. Buscar el servicio viejo "GOLD NAVIDEÑO" para desactivarlo
    const servicioViejo = await db.get(`
      SELECT id, nombre FROM servicios 
      WHERE nombre LIKE '%GOLD%NAVIDE%' OR nombre LIKE '%gold%navide%'
    `);

    if (servicioViejo) {
      console.log(`\n🔍 Servicio viejo encontrado:`);
      console.log(`   ID: ${servicioViejo.id}`);
      console.log(`   Nombre: "${servicioViejo.nombre}"`);
      console.log(`\n⚠️  Para evitar confusiones, puedes:`);
      console.log(`   1. Eliminarlo: DELETE FROM servicios WHERE id = ${servicioViejo.id}`);
      console.log(`   2. O renombrarlo: UPDATE servicios SET nombre = '[VIEJO] ${servicioViejo.nombre}' WHERE id = ${servicioViejo.id}`);
      console.log(`\n¿Deseas eliminarlo automáticamente? (y/n)`);
      
      // Por seguridad, no lo eliminamos automáticamente, solo informamos
      console.log(`\n💡 Para eliminarlo manualmente, ejecuta en el servidor:`);
      console.log(`   sqlite3 backend/database/database.sqlite "DELETE FROM servicios WHERE id = ${servicioViejo.id}"`);
    } else {
      console.log("\nℹ️  No se encontró servicio viejo 'GOLD NAVIDEÑO' para limpiar");
    }

    console.log("\n🎉 Migración completada!");
    console.log("\n📝 Resumen:");
    console.log(`   - Citas actualizadas: ${citasGoldNavideno.length}`);
    console.log(`   - Todas las citas de GOLD NAVIDEÑO ahora usan promocion_id: ${promocion.id}`);
    console.log(`   - Las comisiones se calcularán sobre el precio_comision ($45,000)`);
    console.log(`   - Los clientes pagarán el precio_cliente ($25,000 / $28,000)`);

  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    throw error;
  } finally {
    await db.close();
  }
}

migrarGoldNavideno().catch(console.error);
