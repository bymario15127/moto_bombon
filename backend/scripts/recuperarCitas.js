// backend/scripts/recuperarCitas.js
// Script para recuperar citas eliminadas y gestionar papelera

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const comando = args[0];

async function main() {
  try {
    const db = await open({
      filename: path.join(__dirname, "../database/database.sqlite"),
      driver: sqlite3.Database,
    });

    // 1. Agregar columna deleted_at a tabla citas si no existe
    const columns = await db.all("PRAGMA table_info(citas)");
    const tieneDeletedAt = columns.some((c) => c.name === "deleted_at");

    if (!tieneDeletedAt) {
      console.log("📝 Agregando columna deleted_at a tabla citas...");
      await db.exec("ALTER TABLE citas ADD COLUMN deleted_at DATETIME");
      console.log("✅ Columna deleted_at agregada");
    }

    // 2. Procesar comando
    if (comando === "ver" || comando === "list") {
      console.log("\n🗑️  CITAS ELIMINADAS (PAPELERA):\n");
      const citasEliminadas = await db.all(
        `SELECT id, cliente, fecha, hora, servicio, telefono, deleted_at 
         FROM citas 
         WHERE deleted_at IS NOT NULL 
         ORDER BY deleted_at DESC`
      );

      if (citasEliminadas.length === 0) {
        console.log("✅ No hay citas eliminadas");
      } else {
        citasEliminadas.forEach((cita, idx) => {
          console.log(
            `${idx + 1}. ID: ${cita.id} | ${cita.cliente} | ${cita.fecha} ${cita.hora}`
          );
          console.log(
            `   Servicio: ${cita.servicio} | Teléfono: ${cita.telefono}`
          );
          console.log(`   Eliminada: ${cita.deleted_at}\n`);
        });
      }
      console.log(
        `📊 Total de citas eliminadas: ${citasEliminadas.length}`
      );
    } else if (comando === "recuperar") {
      const citaId = parseInt(args[1], 10);

      if (!citaId || isNaN(citaId)) {
        console.log(
          "❌ Uso: node recuperarCitas.js recuperar <id_cita>"
        );
        process.exit(1);
      }

      const cita = await db.get(
        "SELECT * FROM citas WHERE id = ? AND deleted_at IS NOT NULL",
        citaId
      );

      if (!cita) {
        console.log(
          `❌ Cita ${citaId} no encontrada en papelera o ya fue recuperada`
        );
        process.exit(1);
      }

      await db.run("UPDATE citas SET deleted_at = NULL WHERE id = ?", citaId);

      console.log(`✅ Cita ${citaId} recuperada exitosamente`);
      console.log(`   Cliente: ${cita.cliente}`);
      console.log(`   Fecha: ${cita.fecha} ${cita.hora}`);
      console.log(`   Servicio: ${cita.servicio}`);
    } else if (comando === "eliminar-permanentemente") {
      const citaId = parseInt(args[1], 10);

      if (!citaId || isNaN(citaId)) {
        console.log(
          "❌ Uso: node recuperarCitas.js eliminar-permanentemente <id_cita>"
        );
        process.exit(1);
      }

      const cita = await db.get(
        "SELECT * FROM citas WHERE id = ? AND deleted_at IS NOT NULL",
        citaId
      );

      if (!cita) {
        console.log(
          `❌ Cita ${citaId} no encontrada en papelera o ya fue recuperada`
        );
        process.exit(1);
      }

      await db.run("DELETE FROM citas WHERE id = ?", citaId);

      console.log(`🗑️  Cita ${citaId} eliminada permanentemente`);
      console.log(`   Cliente: ${cita.cliente}`);
      console.log(`   Fecha: ${cita.fecha} ${cita.hora}`);
    } else if (comando === "vaciar-papelera") {
      const diasRetención = parseInt(args[1], 10) || 30;

      const fecha = new Date();
      fecha.setDate(fecha.getDate() - diasRetención);
      const fechaLimite = fecha.toISOString();

      const resultado = await db.run(
        "DELETE FROM citas WHERE deleted_at IS NOT NULL AND deleted_at < ?",
        fechaLimite
      );

      console.log(
        `🗑️  Se eliminaron ${resultado.changes} citas de más de ${diasRetención} días atrás`
      );
    } else {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║        GESTOR DE CITAS ELIMINADAS (PAPELERA)                  ║
╚════════════════════════════════════════════════════════════════╝

COMANDOS DISPONIBLES:

1. Ver citas eliminadas:
   node recuperarCitas.js ver
   node recuperarCitas.js list

2. Recuperar una cita:
   node recuperarCitas.js recuperar <id_cita>
   Ej: node recuperarCitas.js recuperar 5

3. Eliminar permanentemente:
   node recuperarCitas.js eliminar-permanentemente <id_cita>
   Ej: node recuperarCitas.js eliminar-permanentemente 5

4. Vaciar papelera (citas antiguas):
   node recuperarCitas.js vaciar-papelera [días]
   Ej: node recuperarCitas.js vaciar-papelera 30
   Por defecto: 30 días

═══════════════════════════════════════════════════════════════════
      `);
    }

    await db.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
