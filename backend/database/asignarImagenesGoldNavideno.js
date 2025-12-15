// backend/database/asignarImagenesGoldNavideno.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function asignarImagenes() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔄 Asignando imágenes a GOLD NAVIDEÑO...\n");

    // Buscar el servicio GOLD para copiar sus imágenes
    const servicioGold = await db.get(`
      SELECT imagen, imagen_bajo_cc, imagen_alto_cc 
      FROM servicios 
      WHERE nombre LIKE '%GOLD%' AND nombre NOT LIKE '%NAVIDE%'
      LIMIT 1
    `);

    let imagenGeneral = '/uploads/services/gold.jpg'; // Imagen por defecto
    let imagenBajoCC = '';
    let imagenAltoCC = '';

    if (servicioGold) {
      console.log("✅ Servicio GOLD encontrado, copiando sus imágenes:");
      console.log(`   Imagen general: ${servicioGold.imagen || 'No definida'}`);
      console.log(`   Imagen Bajo CC: ${servicioGold.imagen_bajo_cc || 'No definida'}`);
      console.log(`   Imagen Alto CC: ${servicioGold.imagen_alto_cc || 'No definida'}`);
      
      imagenGeneral = servicioGold.imagen || imagenGeneral;
      imagenBajoCC = servicioGold.imagen_bajo_cc || '';
      imagenAltoCC = servicioGold.imagen_alto_cc || '';
    } else {
      console.log("⚠️  No se encontró servicio GOLD, usando imágenes por defecto");
    }

    // Actualizar la promoción GOLD NAVIDEÑO
    const result = await db.run(`
      UPDATE promociones 
      SET imagen = ?,
          imagen_bajo_cc = ?,
          imagen_alto_cc = ?
      WHERE nombre = 'GOLD NAVIDEÑO'
    `, [imagenGeneral, imagenBajoCC, imagenAltoCC]);

    if (result.changes > 0) {
      console.log("\n✅ Imágenes actualizadas en promoción GOLD NAVIDEÑO");
      
      // Verificar actualización
      const promo = await db.get("SELECT * FROM promociones WHERE nombre = 'GOLD NAVIDEÑO'");
      console.log("\n📸 Imágenes asignadas:");
      console.log(`   Imagen general: ${promo.imagen}`);
      console.log(`   Imagen Bajo CC: ${promo.imagen_bajo_cc || 'No definida'}`);
      console.log(`   Imagen Alto CC: ${promo.imagen_alto_cc || 'No definida'}`);
    } else {
      console.log("❌ No se encontró la promoción GOLD NAVIDEÑO");
    }

    console.log("\n💡 Si quieres usar imágenes diferentes:");
    console.log("   1. Ve al panel admin → Promociones");
    console.log("   2. Edita GOLD NAVIDEÑO");
    console.log("   3. Sube las imágenes que desees");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.close();
  }
}

asignarImagenes().catch(console.error);
