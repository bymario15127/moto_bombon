// backend/database/initClientes.js
// Inicializar tabla de clientes con contador de lavadas
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initClientes() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  // Crear tabla de clientes si no existe
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      telefono TEXT,
      lavadas_completadas INTEGER DEFAULT 0,
      lavadas_gratis_pendientes INTEGER DEFAULT 0,
      ultima_lavada_gratis DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Tabla de clientes creada exitosamente");
  
  // Crear tabla de cupones si no existe
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cupones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      email_cliente TEXT NOT NULL,
      usado INTEGER DEFAULT 0,
      fecha_emision DATE NOT NULL,
      fecha_expiracion DATE,
      fecha_uso DATE,
      cita_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cita_id) REFERENCES citas(id)
    )
  `);

  console.log("✅ Tabla de cupones creada exitosamente");

  await db.close();
}

initClientes().catch((err) => {
  console.error("❌ Error inicializando clientes:", err);
  process.exit(1);
});
