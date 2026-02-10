// backend/database/addImagenesToPromociones.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addImagenesToPromociones() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔄 Agregando campos de imágenes a la tabla promociones...\n");

    // Verificar si las columnas ya existen
    const columns = await db.all("PRAGMA table_info(promociones)");
    const columnNames = columns.map(c => c.name);

    if (!columnNames.includes('imagen')) {
      await db.run("ALTER TABLE promociones ADD COLUMN imagen TEXT");
      console.log("✅ Columna 'imagen' agregada");
    } else {
      console.log("ℹ️  Columna 'imagen' ya existe");
    }

    if (!columnNames.includes('imagen_bajo_cc')) {
      await db.run("ALTER TABLE promociones ADD COLUMN imagen_bajo_cc TEXT");
      console.log("✅ Columna 'imagen_bajo_cc' agregada");
    } else {
      console.log("ℹ️  Columna 'imagen_bajo_cc' ya existe");
    }

    if (!columnNames.includes('imagen_alto_cc')) {
      await db.run("ALTER TABLE promociones ADD COLUMN imagen_alto_cc TEXT");
      console.log("✅ Columna 'imagen_alto_cc' agregada");
    } else {
      console.log("ℹ️  Columna 'imagen_alto_cc' ya existe");
    }

    console.log("\n✅ Migración completada exitosamente");

  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    throw error;
  } finally {
    await db.close();
  }
}

addImagenesToPromociones().catch(console.error);
