// backend/database/createLavadores.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createLavadores() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    console.log("🔧 Creando tabla 'lavadores'...");

    // Crear tabla lavadores
    await db.exec(`
      CREATE TABLE IF NOT EXISTS lavadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cedula TEXT,
        especialidad TEXT,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tabla 'lavadores' creada exitosamente");

    // Insertar lavadores de ejemplo
    const existentes = await db.all("SELECT COUNT(*) as count FROM lavadores");
    if (existentes[0].count === 0) {
      console.log("📝 Insertando lavadores de ejemplo...");
      await db.run("INSERT INTO lavadores (nombre, cedula, activo) VALUES (?, ?, ?)", ["Juan Pérez", "1234567890", 1]);
      await db.run("INSERT INTO lavadores (nombre, cedula, activo) VALUES (?, ?, ?)", ["María González", "0987654321", 1]);
      await db.run("INSERT INTO lavadores (nombre, cedula, activo) VALUES (?, ?, ?)", ["Carlos Rodríguez", "1122334455", 1]);
      console.log("✅ Lavadores de ejemplo insertados");
    }

    await db.close();
  } catch (error) {
    console.error("❌ Error al crear tabla lavadores:", error);
  }
}

createLavadores();
