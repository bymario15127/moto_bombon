// backend/database/addLavadorIdToCitas.js
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
    const hasLavadorId = cols.some(c => c.name === "lavador_id");
    
    if (!hasLavadorId) {
      await db.exec("ALTER TABLE citas ADD COLUMN lavador_id INTEGER");
      console.log("✓ Campo 'lavador_id' agregado a citas");
    } else {
      console.log("• Campo 'lavador_id' ya existe en citas");
    }
  } catch (e) {
    console.error("Error aplicando migración lavador_id:", e.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

run();
