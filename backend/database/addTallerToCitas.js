// Script para agregar columnas tipo_cliente y taller_id a citas
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
    console.log("🔄 Agregando columnas a tabla citas...");
    
    // Agregar columna tipo_cliente
    try {
      await db.exec("ALTER TABLE citas ADD COLUMN tipo_cliente TEXT DEFAULT 'cliente'");
      console.log("✅ Columna tipo_cliente agregada");
    } catch (error) {
      if (error.message.includes("duplicate column")) {
        console.log("ℹ️ La columna tipo_cliente ya existe");
      } else {
        throw error;
      }
    }

    // Agregar columna taller_id
    try {
      await db.exec("ALTER TABLE citas ADD COLUMN taller_id INTEGER");
      console.log("✅ Columna taller_id agregada");
    } catch (error) {
      if (error.message.includes("duplicate column")) {
        console.log("ℹ️ La columna taller_id ya existe");
      } else {
        throw error;
      }
    }

    // Verificar estructura
    const citasStructure = await db.all("PRAGMA table_info(citas)");
    console.log("\n📋 Estructura actualizada de la tabla citas:");
    citasStructure.forEach(col => {
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
