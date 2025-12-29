// backend/database/checkCitasStructure.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function check() {
  const db = await open({
    filename: path.join(__dirname, "./database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("📋 Estructura de la tabla citas:");
    const cols = await db.all("PRAGMA table_info(citas)");
    console.table(cols);
    
    console.log("\n📋 Estructura de la tabla lavadores:");
    const lavCols = await db.all("PRAGMA table_info(lavadores)");
    console.table(lavCols);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await db.close();
  }
}

check();
