// Verificar que las promociones y citas estén bien configuradas
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verificar() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  console.log("\n📋 === VERIFICACIÓN DE PROMOCIONES Y NÓMINA ===\n");

  // 1. Ver promociones
  console.log("1️⃣  PROMOCIONES EN LA BD:");
  const promociones = await db.all("SELECT * FROM promociones");
  console.log(JSON.stringify(promociones, null, 2));

  // 2. Ver citas con promocion_id
  console.log("\n2️⃣  ÚLTIMAS 5 CITAS CON PROMOCION_ID:");
  const citas = await db.all(`
    SELECT id, servicio, promocion_id, cilindraje, lavador_id, estado, fecha 
    FROM citas 
    WHERE promocion_id IS NOT NULL 
    ORDER BY fecha DESC 
    LIMIT 5
  `);
  console.log(JSON.stringify(citas, null, 2));

  // 3. Contar citas con promocion_id
  console.log("\n3️⃣  CONTEO DE CITAS CON PROMOCION_ID:");
  const conteo = await db.get("SELECT COUNT(*) as total FROM citas WHERE promocion_id IS NOT NULL");
  console.log(`Total citas con promocion_id: ${conteo.total}`);

  // 4. Verificar si GOLD NAVIDEÑO está en promociones
  console.log("\n4️⃣  PROMOCIÓN GOLD NAVIDEÑO:");
  const goldNav = await db.get("SELECT * FROM promociones WHERE nombre = 'GOLD NAVIDEÑO'");
  if (goldNav) {
    console.log(JSON.stringify(goldNav, null, 2));
  } else {
    console.log("❌ No se encontró promoción GOLD NAVIDEÑO");
  }

  // 5. Ver citas de GOLD NAVIDEÑO
  console.log("\n5️⃣  CITAS DE GOLD NAVIDEÑO:");
  const citasGold = await db.all(`
    SELECT c.id, c.servicio, c.promocion_id, c.cilindraje, c.lavador_id, l.nombre as lavador, c.estado, c.fecha
    FROM citas c
    LEFT JOIN lavadores l ON l.id = c.lavador_id
    WHERE c.servicio = 'GOLD NAVIDEÑO' OR c.promocion_id = (SELECT id FROM promociones WHERE nombre = 'GOLD NAVIDEÑO')
    ORDER BY c.fecha DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(citasGold, null, 2));

  await db.close();
}

verificar().catch(console.error);
