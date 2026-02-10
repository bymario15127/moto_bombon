// backend/database/addMetodoPago.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const db = await open({
    filename: path.join(__dirname, "./database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    const cols = await db.all("PRAGMA table_info(citas)");
    const hasMetodo = cols.some(c => c.name === "metodo_pago");
    if (!hasMetodo) {
      await db.exec("ALTER TABLE citas ADD COLUMN metodo_pago TEXT");
      console.log("✓ Campo 'metodo_pago' agregado a citas");
    } else {
      console.log("• Campo 'metodo_pago' ya existe en citas");
    }
  } catch (e) {
    console.error("Error aplicando migración metodo_pago:", e.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

run();
