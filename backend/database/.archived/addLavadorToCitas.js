// backend/database/addLavadorToCitas.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addLavadorToCitas() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    console.log("🔧 Verificando columna 'lavador_id' en tabla 'citas'...");

    // Verificar si la columna ya existe
    const columns = await db.all("PRAGMA table_info(citas)");
    const hasLavadorId = columns.some((c) => c.name === "lavador_id");

    if (!hasLavadorId) {
      console.log("➕ Agregando columna 'lavador_id'...");
      await db.exec("ALTER TABLE citas ADD COLUMN lavador_id INTEGER");
      console.log("✅ Columna 'lavador_id' agregada exitosamente");
    } else {
      console.log("ℹ️ La columna 'lavador_id' ya existe");
    }

    await db.close();
  } catch (error) {
    console.error("❌ Error al agregar columna lavador_id:", error);
  }
}

addLavadorToCitas();
