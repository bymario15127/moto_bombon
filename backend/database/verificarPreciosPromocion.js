// Verificar que los precios de cliente estén bien en la promoción
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

  console.log("\n🔍 Verificando precios en promoción GOLD NAVIDEÑO:");
  const promo = await db.get("SELECT * FROM promociones WHERE id = 1");
  
  console.log("Precios cliente:", {
    bajo_cc: promo.precio_cliente_bajo_cc,
    alto_cc: promo.precio_cliente_alto_cc
  });
  
  console.log("\nPrecios comisión:", {
    bajo_cc: promo.precio_comision_bajo_cc,
    alto_cc: promo.precio_comision_alto_cc
  });
  
  if (!promo.precio_cliente_bajo_cc || !promo.precio_cliente_alto_cc) {
    console.log("\n⚠️ Precios cliente están NULL, actualizando...");
    await db.run(
      "UPDATE promociones SET precio_cliente_bajo_cc = 25000, precio_cliente_alto_cc = 28000 WHERE id = 1"
    );
    console.log("✅ Actualizado correctamente");
  } else {
    console.log("\n✅ Los precios ya están guardados correctamente");
  }
  
  await db.close();
}

verificar();
