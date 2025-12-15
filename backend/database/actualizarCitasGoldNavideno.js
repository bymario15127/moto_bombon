// Actualizar citas GOLD NAVIDEÑO sin promocion_id
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function actualizar() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  console.log("\n🔧 === ACTUALIZAR CITAS GOLD NAVIDEÑO ===\n");

  try {
    // Actualizar
    const result = await db.run(
      "UPDATE citas SET promocion_id = 1 WHERE servicio = 'GOLD NAVIDEÑO' AND promocion_id IS NULL"
    );
    console.log(`✅ Citas actualizadas: ${result.changes}`);

    // Verificar
    const citas = await db.all(
      "SELECT id, servicio, promocion_id FROM citas WHERE servicio = 'GOLD NAVIDEÑO' ORDER BY id"
    );
    
    console.log("\n📋 Todas las citas GOLD NAVIDEÑO:");
    console.log(JSON.stringify(citas, null, 2));

  } catch (error) {
    console.error("❌ Error:", error);
  }

  await db.close();
}

actualizar();
