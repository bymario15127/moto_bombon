// backend/database/migrarCitasExistentes.js
// Script para migrar citas existentes al sistema de fidelización
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrarCitasExistentes() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  console.log("🔄 Iniciando migración de citas existentes...");
  console.log("================================================\n");

  try {
    // 1. Obtener todas las citas finalizadas con email (solo citas normales, no talleres aliados)
    const citasCompletadas = await db.all(`
      SELECT cliente, email, telefono, COUNT(*) as total_lavadas
      FROM citas 
      WHERE estado = 'finalizada' 
        AND email IS NOT NULL 
        AND email != ''
        AND taller_id IS NULL
      GROUP BY LOWER(email)
      ORDER BY total_lavadas DESC
    `);

    console.log(`📊 Encontradas ${citasCompletadas.length} clientes con citas completadas\n`);

    if (citasCompletadas.length === 0) {
      console.log("⚠️ No se encontraron citas finalizadas con email");
      console.log("💡 Asegúrate de que las citas tengan:");
      console.log("   - estado = 'finalizada'");
      console.log("   - email válido\n");
      await db.close();
      return;
    }

    let clientesCreados = 0;
    let clientesActualizados = 0;
    let cuponesGenerados = 0;

    // 2. Procesar cada cliente
    for (const cita of citasCompletadas) {
      const email = cita.email.toLowerCase().trim();
      const nombre = cita.cliente;
      const telefono = cita.telefono || '';
      const totalLavadas = cita.total_lavadas;

      // Verificar si el cliente ya existe
      const clienteExistente = await db.get(
        'SELECT * FROM clientes WHERE email = ?',
        [email]
      );

      if (clienteExistente) {
        // Actualizar cliente existente
        await db.run(`
          UPDATE clientes 
          SET lavadas_completadas = ?,
              total_lavadas_historico = ?,
              nombre = ?,
              telefono = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE email = ?
        `, [totalLavadas % 10, totalLavadas, nombre, telefono, email]);
        
        clientesActualizados++;
        console.log(`✏️  Actualizado: ${nombre} (${email}) - ${totalLavadas} lavadas`);
      } else {
        // Crear nuevo cliente
        await db.run(`
          INSERT INTO clientes (email, nombre, telefono, lavadas_completadas, total_lavadas_historico, lavadas_gratis_pendientes)
          VALUES (?, ?, ?, ?, ?, 0)
        `, [email, nombre, telefono, totalLavadas % 10, totalLavadas]);
        
        clientesCreados++;
        console.log(`✅ Creado: ${nombre} (${email}) - ${totalLavadas} lavadas`);
      }

      // 3. Generar cupones por cada 10 lavadas completadas
      const cuponesQueDebeTener = Math.floor(totalLavadas / 10);
      
      if (cuponesQueDebeTener > 0) {
        // Verificar cupones existentes
        const cuponesExistentes = await db.all(
          'SELECT * FROM cupones WHERE email_cliente = ?',
          [email]
        );

        const cuponesFaltantes = cuponesQueDebeTener - cuponesExistentes.length;

        // Generar cupones faltantes
        for (let i = 0; i < cuponesFaltantes; i++) {
          const codigoCupon = generarCodigoCupon();
          const fechaEmision = new Date().toISOString().split('T')[0];
          
          await db.run(`
            INSERT INTO cupones (codigo, email_cliente, usado, fecha_emision)
            VALUES (?, ?, 0, ?)
          `, [codigoCupon, email, fechaEmision]);
          
          cuponesGenerados++;
          console.log(`   🎁 Cupón generado: ${codigoCupon}`);
        }

        // Actualizar lavadas gratis pendientes
        await db.run(`
          UPDATE clientes 
          SET lavadas_gratis_pendientes = ?
          WHERE email = ?
        `, [cuponesQueDebeTener, email]);
      }
    }

    // 4. Mostrar resumen
    console.log("\n================================================");
    console.log("✅ MIGRACIÓN COMPLETADA");
    console.log("================================================\n");
    console.log(`📊 Resumen:`);
    console.log(`   - Clientes nuevos creados: ${clientesCreados}`);
    console.log(`   - Clientes actualizados: ${clientesActualizados}`);
    console.log(`   - Total clientes: ${citasCompletadas.length}`);
    console.log(`   - Cupones generados: ${cuponesGenerados}`);
    console.log(`   - Total lavadas procesadas: ${citasCompletadas.reduce((sum, c) => sum + c.total_lavadas, 0)}`);
    
    // Mostrar top 5 clientes
    console.log("\n🏆 Top 5 Clientes:");
    const top5 = citasCompletadas.slice(0, 5);
    top5.forEach((c, i) => {
      const cupones = Math.floor(c.total_lavadas / 10);
      console.log(`   ${i + 1}. ${c.cliente} - ${c.total_lavadas} lavadas (${cupones} cupones)`);
    });

    console.log("\n💡 Nota: Los cupones generados NO se enviaron por email.");
    console.log("   Los clientes pueden ver sus cupones en el sistema.\n");

  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    throw error;
  } finally {
    await db.close();
  }
}

// Función auxiliar para generar código de cupón
function generarCodigoCupon() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GRATIS-${timestamp}-${random}`;
}

// Ejecutar migración
migrarCitasExistentes()
  .then(() => {
    console.log("🎉 Proceso finalizado exitosamente");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error fatal:", err);
    process.exit(1);
  });
