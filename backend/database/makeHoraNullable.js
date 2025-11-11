// backend/database/makeHoraNullable.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    const columns = await db.all("PRAGMA table_info(citas)");
    const horaCol = columns.find(c => c.name === 'hora');

    // Si la columna ya permite NULL (notnull === 0), no hacemos nada
    if (horaCol && horaCol.notnull === 0) {
      console.log("• La columna 'hora' ya permite valores NULL. No se requiere migración.");
      return;
    }

    console.log("Iniciando migración para permitir hora NULL en 'citas'...");

    await db.exec("BEGIN TRANSACTION");

    // Crear nueva tabla con 'hora' NULL y todos los campos actuales y nuevos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS citas_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT, -- ahora NULL permitido
        servicio TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        comentarios TEXT,
        estado TEXT DEFAULT 'pendiente',
        placa TEXT,
        marca TEXT,
        modelo TEXT,
        cilindraje INTEGER,
        metodo_pago TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Detectar qué columnas existen realmente para construir INSERT/SELECT seguro
    const existingCols = new Set(columns.map(c => c.name));
    const optionalCols = ['telefono','email','comentarios','estado','placa','marca','modelo','cilindraje','metodo_pago','created_at'];
    const baseCols = ['id','cliente','fecha','hora','servicio'];
    const copyCols = [...baseCols, ...optionalCols.filter(c => existingCols.has(c))];

    const colsList = copyCols.join(', ');
    await db.exec(`INSERT INTO citas_new (${colsList}) SELECT ${colsList} FROM citas`);

    await db.exec("DROP TABLE citas");
    await db.exec("ALTER TABLE citas_new RENAME TO citas");

    await db.exec("COMMIT");
    console.log("✅ Migración completada: la columna 'hora' ahora es NULLABLE");
  } catch (e) {
    try { await db.exec("ROLLBACK"); } catch {}
    console.error("❌ Error en migración hora NULL:", e.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

run();
