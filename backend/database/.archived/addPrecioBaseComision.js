// backend/database/addPrecioBaseComision.js
// Script para agregar precio_base_comision_bajo y precio_base_comision_alto a servicios
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addPrecioBaseComision() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔄 Agregando campos precio_base_comision a servicios...");
    
    // Verificar si las columnas ya existen
    const columns = await db.all("PRAGMA table_info(servicios)");
    const columnNames = columns.map(col => col.name);

    if (!columnNames.includes('precio_base_comision_bajo')) {
      await db.exec("ALTER TABLE servicios ADD COLUMN precio_base_comision_bajo REAL");
      console.log("✓ Campo 'precio_base_comision_bajo' agregado");
      
      // Copiar valores existentes de precio_bajo_cc
      await db.exec("UPDATE servicios SET precio_base_comision_bajo = precio_bajo_cc WHERE precio_base_comision_bajo IS NULL");
      console.log("✓ Valores iniciales copiados desde precio_bajo_cc");
    } else {
      console.log("ℹ️ Campo 'precio_base_comision_bajo' ya existe");
    }

    if (!columnNames.includes('precio_base_comision_alto')) {
      await db.exec("ALTER TABLE servicios ADD COLUMN precio_base_comision_alto REAL");
      console.log("✓ Campo 'precio_base_comision_alto' agregado");
      
      // Copiar valores existentes de precio_alto_cc
      await db.exec("UPDATE servicios SET precio_base_comision_alto = precio_alto_cc WHERE precio_base_comision_alto IS NULL");
      console.log("✓ Valores iniciales copiados desde precio_alto_cc");
    } else {
      console.log("ℹ️ Campo 'precio_base_comision_alto' ya existe");
    }

    console.log("\n✅ Migración completada exitosamente");
    console.log("\n📝 Ahora puedes:");
    console.log("   1. Editar servicios promocionales para tener:");
    console.log("      - precio_bajo_cc: precio al cliente (ej: $25.000)");
    console.log("      - precio_base_comision_bajo: precio para calcular comisión (ej: $45.000)");
    console.log("   2. La nómina usará precio_base_comision para calcular las comisiones del lavador");
  } catch (error) {
    console.error("❌ Error en la migración:", error);
  } finally {
    await db.close();
  }
}

addPrecioBaseComision();
