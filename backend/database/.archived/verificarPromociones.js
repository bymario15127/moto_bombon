// backend/database/verificarPromociones.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verificarPromociones() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    console.log("🔍 Verificando promociones en la base de datos...\n");

    // Ver todas las promociones
    const promociones = await db.all("SELECT * FROM promociones");
    
    if (promociones.length === 0) {
      console.log("❌ No hay promociones en la base de datos");
      console.log("\n💡 Ejecuta: node database/createPromociones.js");
      return;
    }

    console.log(`✅ Encontradas ${promociones.length} promociones:\n`);
    
    promociones.forEach((promo, index) => {
      console.log(`${index + 1}. ${promo.nombre}`);
      console.log(`   ID: ${promo.id}`);
      console.log(`   Activo: ${promo.activo ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Precio Cliente Bajo CC: $${promo.precio_cliente_bajo_cc?.toLocaleString('es-CO') || 'N/A'}`);
      console.log(`   Precio Cliente Alto CC: $${promo.precio_cliente_alto_cc?.toLocaleString('es-CO') || 'N/A'}`);
      console.log(`   Precio Comisión Bajo CC: $${promo.precio_comision_bajo_cc?.toLocaleString('es-CO') || 'N/A'}`);
      console.log(`   Precio Comisión Alto CC: $${promo.precio_comision_alto_cc?.toLocaleString('es-CO') || 'N/A'}`);
      console.log(`   Duración: ${promo.duracion} min`);
      console.log(`   Fecha Inicio: ${promo.fecha_inicio || 'Sin límite'}`);
      console.log(`   Fecha Fin: ${promo.fecha_fin || 'Sin límite'}`);
      console.log(`   Imagen: ${promo.imagen || 'No definida'}`);
      console.log(`   Imagen Bajo CC: ${promo.imagen_bajo_cc || 'No definida'}`);
      console.log(`   Imagen Alto CC: ${promo.imagen_alto_cc || 'No definida'}`);
      console.log("");
    });

    // Verificar promociones vigentes (activas y dentro de fecha)
    const hoy = new Date().toISOString().split('T')[0];
    const vigentes = await db.all(`
      SELECT * FROM promociones 
      WHERE activo = 1 
        AND (fecha_inicio IS NULL OR fecha_inicio <= ?)
        AND (fecha_fin IS NULL OR fecha_fin >= ?)
    `, [hoy, hoy]);

    console.log(`\n📅 Promociones vigentes hoy (${hoy}):`);
    if (vigentes.length === 0) {
      console.log("❌ No hay promociones vigentes");
    } else {
      vigentes.forEach(p => {
        console.log(`   ✅ ${p.nombre} (ID: ${p.id})`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.close();
  }
}

verificarPromociones().catch(console.error);
