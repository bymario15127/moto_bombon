// Script para agregar columnas imagen_bajo_cc e imagen_alto_cc a la tabla servicios
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
    console.log("🔄 Agregando columnas imagen_bajo_cc e imagen_alto_cc...");
    
    // Agregar columna imagen_bajo_cc
    try {
      await db.exec("ALTER TABLE servicios ADD COLUMN imagen_bajo_cc TEXT");
      console.log("✅ Columna imagen_bajo_cc agregada");
    } catch (error) {
      if (error.message.includes("duplicate column")) {
        console.log("ℹ️ La columna imagen_bajo_cc ya existe");
      } else {
        throw error;
      }
    }

    // Agregar columna imagen_alto_cc
    try {
      await db.exec("ALTER TABLE servicios ADD COLUMN imagen_alto_cc TEXT");
      console.log("✅ Columna imagen_alto_cc agregada");
    } catch (error) {
      if (error.message.includes("duplicate column")) {
        console.log("ℹ️ La columna imagen_alto_cc ya existe");
      } else {
        throw error;
      }
    }

    // Verificar estructura
    const servicios = await db.all("PRAGMA table_info(servicios)");
    console.log("\n📋 Estructura actual de la tabla servicios:");
    servicios.forEach(col => {
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
