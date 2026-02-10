// backend/scripts/verCitas.js
// Script simple para ver todos los registros de citas

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const db = await open({
      filename: path.join(__dirname, "../database/database.sqlite"),
      driver: sqlite3.Database,
    });

    console.log("\n📋 TODAS LAS CITAS EN BASE DE DATOS:\n");

    const citas = await db.all(`
      SELECT 
        id, 
        cliente, 
        fecha, 
        hora, 
        servicio, 
        telefono, 
        email, 
        estado,
        created_at
      FROM citas 
      ORDER BY fecha DESC, hora DESC
    `);

    if (citas.length === 0) {
      console.log("❌ No hay citas registradas");
    } else {
      console.log(`✅ Total: ${citas.length} citas\n`);
      console.log("=" + "=".repeat(150));
      
      citas.forEach((cita, idx) => {
        console.log(`\n${idx + 1}. ID: ${cita.id}`);
        console.log(`   Cliente: ${cita.cliente}`);
        console.log(`   Fecha: ${cita.fecha}  |  Hora: ${cita.hora}`);
        console.log(`   Servicio: ${cita.servicio}`);
        console.log(`   Teléfono: ${cita.telefono || "N/A"}  |  Email: ${cita.email || "N/A"}`);
        console.log(`   Estado: ${cita.estado}`);
        console.log(`   Creada: ${cita.created_at}`);
      });
      
      console.log("\n" + "=".repeat(150) + "\n");
    }

    await db.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
