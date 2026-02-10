// Verificar y actualizar promoción GOLD NAVIDEÑO
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verificarYActualizar() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  console.log("\n📋 PROMOCIÓN ACTUAL:");
  const promo = await db.get("SELECT * FROM promociones WHERE nombre = 'GOLD NAVIDEÑO'");
  console.log(JSON.stringify(promo, null, 2));

  if (!promo.precio_cliente_bajo_cc || !promo.precio_cliente_alto_cc) {
    console.log("\n⚠️ Precios de cliente están NULL, actualizando...");
    await db.run(
      "UPDATE promociones SET precio_cliente_bajo_cc = ?, precio_cliente_alto_cc = ? WHERE nombre = 'GOLD NAVIDEÑO'",
      [25000, 28000]
    );
    console.log("✅ Actualizado");
  }

  console.log("\n📋 PROMOCIÓN DESPUÉS:");
  const promoActualizado = await db.get("SELECT * FROM promociones WHERE nombre = 'GOLD NAVIDEÑO'");
  console.log(JSON.stringify(promoActualizado, null, 2));

  await db.close();
}

verificarYActualizar();
