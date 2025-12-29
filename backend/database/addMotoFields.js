// backend/database/addMotoFields.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addMotoFields() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    // Agregar campos a la tabla citas
    const citasColumns = await db.all("PRAGMA table_info(citas)");
    const citasColumnNames = citasColumns.map(col => col.name);

    if (!citasColumnNames.includes('placa')) {
      await db.exec("ALTER TABLE citas ADD COLUMN placa TEXT");
      console.log("✓ Campo 'placa' agregado a citas");
    }

    if (!citasColumnNames.includes('marca')) {
      await db.exec("ALTER TABLE citas ADD COLUMN marca TEXT");
      console.log("✓ Campo 'marca' agregado a citas");
    }

    if (!citasColumnNames.includes('modelo')) {
      await db.exec("ALTER TABLE citas ADD COLUMN modelo TEXT");
      console.log("✓ Campo 'modelo' agregado a citas");
    }

    if (!citasColumnNames.includes('cilindraje')) {
      await db.exec("ALTER TABLE citas ADD COLUMN cilindraje INTEGER");
      console.log("✓ Campo 'cilindraje' agregado a citas");
    }

    // Agregar campos a la tabla servicios
    const serviciosColumns = await db.all("PRAGMA table_info(servicios)");
    const serviciosColumnNames = serviciosColumns.map(col => col.name);

    if (!serviciosColumnNames.includes('precio_bajo_cc')) {
      await db.exec("ALTER TABLE servicios ADD COLUMN precio_bajo_cc REAL");
      console.log("✓ Campo 'precio_bajo_cc' agregado a servicios");
      
      // Copiar precio existente a precio_bajo_cc
      await db.exec("UPDATE servicios SET precio_bajo_cc = precio WHERE precio_bajo_cc IS NULL");
    }

    if (!serviciosColumnNames.includes('precio_alto_cc')) {
      await db.exec("ALTER TABLE servicios ADD COLUMN precio_alto_cc REAL");
      console.log("✓ Campo 'precio_alto_cc' agregado a servicios");
      
      // Copiar precio existente a precio_alto_cc
      await db.exec("UPDATE servicios SET precio_alto_cc = precio WHERE precio_alto_cc IS NULL");
    }

    console.log("\n✅ Migración completada exitosamente");
  } catch (error) {
    console.error("❌ Error en la migración:", error);
  } finally {
    await db.close();
  }
}

addMotoFields();
