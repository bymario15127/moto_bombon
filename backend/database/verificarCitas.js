// backend/database/verificarCitas.js
// Script para verificar el estado de las citas
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verificarCitas() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔍 Verificando estado de las citas...\n");

    // Total de citas
    const total = await db.get("SELECT COUNT(*) as total FROM citas");
    console.log(`📊 Total de citas: ${total.total}`);

    // Citas por estado
    const porEstado = await db.all(`
      SELECT estado, COUNT(*) as cantidad 
      FROM citas 
      GROUP BY estado 
      ORDER BY cantidad DESC
    `);
    
    console.log("\n📈 Citas por estado:");
    porEstado.forEach(e => {
      console.log(`   - ${e.estado || '(sin estado)'}: ${e.cantidad}`);
    });

    // Citas con email
    const conEmail = await db.get("SELECT COUNT(*) as total FROM citas WHERE email IS NOT NULL AND email != ''");
    console.log(`\n📧 Citas con email: ${conEmail.total}`);

    // Citas completadas con email
    const completadasConEmail = await db.get(`
      SELECT COUNT(*) as total 
      FROM citas 
      WHERE estado = 'completada' 
        AND email IS NOT NULL 
        AND email != ''
    `);
    console.log(`✅ Citas completadas con email: ${completadasConEmail.total}`);

    // Citas finalizadas con email (si usan ese estado)
    const finalizadasConEmail = await db.get(`
      SELECT COUNT(*) as total 
      FROM citas 
      WHERE estado = 'finalizada' 
        AND email IS NOT NULL 
        AND email != ''
    `);
    console.log(`✅ Citas finalizadas con email: ${finalizadasConEmail.total}`);

    // Ejemplos de citas recientes
    console.log("\n📋 Ejemplos de citas recientes:");
    const ejemplos = await db.all(`
      SELECT id, cliente, email, estado, fecha 
      FROM citas 
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    ejemplos.forEach(c => {
      console.log(`   ID ${c.id}: ${c.cliente} (${c.email || 'sin email'}) - Estado: ${c.estado || 'sin estado'} - ${c.fecha}`);
    });

    console.log("\n💡 Nota: El sistema de fidelización registra citas con estado 'completada'");
    console.log("   Si usas otro estado, necesitamos ajustar el script de migración.\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.close();
  }
}

verificarCitas().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
