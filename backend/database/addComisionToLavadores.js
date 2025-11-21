// backend/database/addComisionToLavadores.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addComisionToLavadores() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    console.log("🔧 Verificando columna 'comision_porcentaje' en tabla 'lavadores'...");

    // Verificar si la columna ya existe
    const columns = await db.all("PRAGMA table_info(lavadores)");
    const hasComision = columns.some((c) => c.name === "comision_porcentaje");

    if (!hasComision) {
      console.log("➕ Agregando columna 'comision_porcentaje'...");
      await db.exec("ALTER TABLE lavadores ADD COLUMN comision_porcentaje REAL DEFAULT 30.0");
      console.log("✅ Columna 'comision_porcentaje' agregada exitosamente (default 30%)");
    } else {
      console.log("ℹ️ La columna 'comision_porcentaje' ya existe");
    }

    await db.close();
  } catch (error) {
    console.error("❌ Error al agregar columna comision_porcentaje:", error);
  }
}

addComisionToLavadores();
