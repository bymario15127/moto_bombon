// backend/database/addTotalLavadas.js
// Agregar columna para rastrear el total histórico de lavadas
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addTotalLavadas() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    // Verificar si la columna ya existe
    const columns = await db.all("PRAGMA table_info(clientes)");
    const hasColumn = columns.some((col) => col.name === "total_lavadas_historico");

    if (!hasColumn) {
      // Agregar columna para total histórico
      await db.exec("ALTER TABLE clientes ADD COLUMN total_lavadas_historico INTEGER DEFAULT 0");
      console.log("✅ Columna total_lavadas_historico agregada");

      // Actualizar valores existentes: copiar lavadas_completadas a total_lavadas_historico
      await db.exec(`
        UPDATE clientes 
        SET total_lavadas_historico = lavadas_completadas 
        WHERE total_lavadas_historico = 0
      `);
      console.log("✅ Valores históricos actualizados");
    } else {
      console.log("ℹ️ La columna total_lavadas_historico ya existe");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.close();
  }
}

addTotalLavadas().catch((err) => {
  console.error("❌ Error ejecutando migración:", err);
  process.exit(1);
});
