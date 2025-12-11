// Script para crear tabla de talleres aliados
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  const db = await open({
    filename: path.join(__dirname, "./database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔄 Creando tabla talleres...");
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS talleres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        contacto TEXT,
        telefono TEXT,
        email TEXT,
        precio_bajo_cc REAL,
        precio_alto_cc REAL,
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Tabla talleres creada");

    // Agregar columna tipo_cliente a citas si no existe
    try {
      await db.exec("ALTER TABLE citas ADD COLUMN tipo_cliente TEXT DEFAULT 'cliente'");
      console.log("✅ Columna tipo_cliente agregada a citas");
    } catch (error) {
      if (error.message.includes("duplicate column")) {
        console.log("ℹ️ La columna tipo_cliente ya existe");
      } else {
        throw error;
      }
    }

    // Verificar estructura
    const talleres = await db.all("PRAGMA table_info(talleres)");
    console.log("\n📋 Estructura de la tabla talleres:");
    talleres.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    console.log("\n✅ Base de datos actualizada correctamente");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.close();
  }
};

run();
