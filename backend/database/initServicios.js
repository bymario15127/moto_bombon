// backend/database/initServicios.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    // Crear tabla servicios si no existe
    await db.exec(`
      CREATE TABLE IF NOT EXISTS servicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        duracion INTEGER NOT NULL,
        precio REAL NOT NULL,
        descripcion TEXT,
        imagen TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar servicios predeterminados si la tabla está vacía
    const count = await db.get("SELECT COUNT(*) as count FROM servicios");
    
    if (count.count === 0) {
      const serviciosDefault = [
        {
          nombre: "Depilación de cejas",
          duracion: 30,
          precio: 25000,
          descripcion: "Depilación profesional con técnicas precisas",
          imagen: "/img/cejas.jpg"
        },
        {
          nombre: "Extensión de pestañas",
          duracion: 90,
          precio: 80000,
          descripcion: "Extensiones de pestañas volumen ruso",
          imagen: "/img/pestanas.jpg"
        },
        {
          nombre: "Lifting de pestañas",
          duracion: 60,
          precio: 45000,
          descripcion: "Lifting y tinte de pestañas naturales",
          imagen: "/img/lifting.jpg"
        }
      ];

      for (const servicio of serviciosDefault) {
        await db.run(
          "INSERT INTO servicios (nombre, duracion, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)",
          [servicio.nombre, servicio.duracion, servicio.precio, servicio.descripcion, servicio.imagen]
        );
      }

      console.log("✅ Servicios predeterminados insertados");
    }

    console.log("✅ Tabla servicios lista");
    await db.close();
  } catch (error) {
    console.error("❌ Error al inicializar servicios:", error);
  }
})();