// backend/database/createPromociones.js
// Script para crear tabla de promociones
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createPromociones() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔄 Creando tabla de promociones...");
    
    await db.run(`
      CREATE TABLE IF NOT EXISTS promociones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio_cliente_bajo_cc REAL,
        precio_cliente_alto_cc REAL,
        precio_comision_bajo_cc REAL NOT NULL,
        precio_comision_alto_cc REAL NOT NULL,
        duracion INTEGER NOT NULL,
        activo INTEGER DEFAULT 1,
        fecha_inicio DATE,
        fecha_fin DATE,
        imagen TEXT,
        imagen_bajo_cc TEXT,
        imagen_alto_cc TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Tabla 'promociones' creada");

    // Agregar campo promocion_id a citas si no existe
    const columns = await db.all("PRAGMA table_info(citas)");
    const columnNames = columns.map(col => col.name);

    if (!columnNames.includes('promocion_id')) {
      await db.exec("ALTER TABLE citas ADD COLUMN promocion_id INTEGER");
      console.log("✅ Campo 'promocion_id' agregado a citas");
    }

    // Insertar promoción navideña como ejemplo
    const promoExists = await db.get("SELECT id FROM promociones WHERE nombre = 'GOLD NAVIDEÑO'");
    if (!promoExists) {
      await db.run(`
        INSERT INTO promociones (
          nombre, 
          descripcion, 
          precio_cliente_bajo_cc, 
          precio_cliente_alto_cc,
          precio_comision_bajo_cc,
          precio_comision_alto_cc,
          duracion,
          activo,
          fecha_inicio,
          fecha_fin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'GOLD NAVIDEÑO',
        'GRACIAS POR HACER FELIZ A UNA FAMILIA EN ESTE DICIEMBRE',
        25000,  // Precio al cliente bajo CC
        28000,  // Precio al cliente alto CC
        45000,  // Precio para comisión bajo CC
        45000,  // Precio para comisión alto CC
        60,     // Duración en minutos
        1,      // Activo
        '2025-12-01',
        '2025-12-31'
      ]);
      console.log("✅ Promoción 'GOLD NAVIDEÑO' creada como ejemplo");
    }

    console.log("\n✅ Migración completada exitosamente");
    console.log("\n📝 Ahora:");
    console.log("   - Las promociones están separadas de los servicios normales");
    console.log("   - precio_cliente: lo que cobra al cliente");
    console.log("   - precio_comision: sobre qué monto se calcula la comisión del lavador");
    console.log("   - Puedes activar/desactivar promociones sin afectar servicios");
  } catch (error) {
    console.error("❌ Error en la migración:", error);
  } finally {
    await db.close();
  }
}

createPromociones();
