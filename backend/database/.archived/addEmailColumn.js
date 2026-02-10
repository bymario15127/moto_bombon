// backend/database/addEmailColumn.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addEmailColumn() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    // Verificar si la columna ya existe
    const columns = await db.all("PRAGMA table_info(citas)");
    const hasEmail = columns.some(col => col.name === 'email');

    if (!hasEmail) {
      await db.exec("ALTER TABLE citas ADD COLUMN email TEXT");
      console.log("✅ Columna 'email' agregada exitosamente a la tabla citas");
    } else {
      console.log("ℹ️ La columna 'email' ya existe en la tabla citas");
    }
  } catch (error) {
    console.error("❌ Error al agregar columna:", error);
  } finally {
    await db.close();
  }
}

addEmailColumn();
