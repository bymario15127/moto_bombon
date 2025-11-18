// backend/database/renameTelefonoToCedula.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renameTelefonoToCedula() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    console.log("🔧 Renombrando columna 'telefono' a 'cedula' en tabla 'lavadores'...");

    // SQLite no permite renombrar columnas directamente, necesitamos recrear la tabla
    await db.exec(`
      BEGIN TRANSACTION;
      
      -- Crear tabla temporal con la nueva estructura
      CREATE TABLE lavadores_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cedula TEXT,
        especialidad TEXT,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Copiar datos de la tabla antigua a la nueva
      INSERT INTO lavadores_new (id, nombre, cedula, especialidad, activo, created_at)
      SELECT id, nombre, telefono, especialidad, activo, created_at FROM lavadores;
      
      -- Eliminar tabla antigua
      DROP TABLE lavadores;
      
      -- Renombrar tabla nueva
      ALTER TABLE lavadores_new RENAME TO lavadores;
      
      COMMIT;
    `);

    console.log("✅ Columna renombrada exitosamente de 'telefono' a 'cedula'");

    await db.close();
  } catch (error) {
    console.error("❌ Error al renombrar columna:", error);
  }
}

renameTelefonoToCedula();
