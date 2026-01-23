// backend/database/initFinanzas.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initFinanzas() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    // Crear tabla de gastos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gastos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        categoria TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL,
        fecha DATE NOT NULL,
        empleado_id INTEGER,
        metodo_pago TEXT,
        estado TEXT DEFAULT 'completado',
        notas TEXT,
        registrado_por TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tabla de gastos creada exitosamente");

    // Crear índices para optimizar consultas
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
      CREATE INDEX IF NOT EXISTS idx_gastos_tipo ON gastos(tipo);
      CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
      CREATE INDEX IF NOT EXISTS idx_gastos_empleado ON gastos(empleado_id);
    `);

    console.log("✅ Índices de gastos creados");

    await db.close();
    console.log("✅ Módulo de finanzas inicializado correctamente");
  } catch (error) {
    console.error("❌ Error inicializando finanzas:", error);
    throw error;
  }
}

initFinanzas().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
