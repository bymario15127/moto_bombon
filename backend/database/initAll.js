// backend/database/initAll.js
// Script para inicializar toda la base de datos de una sola vez
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initAll() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    console.log("🔄 Inicializando base de datos completa...\n");

    // 1. Crear tabla citas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT,
        servicio TEXT NOT NULL,
        lavador_id INTEGER,
        telefono TEXT,
        cedula TEXT,
        email TEXT,
        comentarios TEXT,
        estado TEXT DEFAULT 'pendiente',
        metodo_pago TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lavador_id) REFERENCES lavadores(id)
      )
    `);
    console.log("✅ Tabla 'citas' creada");

    // 2. Crear tabla lavadores
    await db.exec(`
      CREATE TABLE IF NOT EXISTS lavadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cedula TEXT UNIQUE,
        activo INTEGER DEFAULT 1,
        comision_porcentaje REAL DEFAULT 30.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla 'lavadores' creada");

    // Insertar lavadores de ejemplo si la tabla está vacía
    const lavadorCount = await db.get("SELECT COUNT(*) as total FROM lavadores");
    if (lavadorCount.total === 0) {
      await db.run(
        "INSERT INTO lavadores (nombre, cedula, activo, comision_porcentaje) VALUES (?, ?, ?, ?)",
        ["Juan Pérez", "1234567890", 1, 30.0]
      );
      await db.run(
        "INSERT INTO lavadores (nombre, cedula, activo, comision_porcentaje) VALUES (?, ?, ?, ?)",
        ["María García", "9876543210", 1, 30.0]
      );
      console.log("✅ Lavadores de ejemplo insertados");
    }

    // 3. Crear tabla servicios
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
    console.log("✅ Tabla 'servicios' creada");

    // Insertar servicios de ejemplo si la tabla está vacía
    const servicioCount = await db.get("SELECT COUNT(*) as count FROM servicios");
    if (servicioCount.count === 0) {
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
          precio: 50000,
          descripcion: "Levantamiento y rizamiento de pestañas",
          imagen: "/img/lifting.jpg"
        },
        {
          nombre: "Diseño de cejas",
          duracion: 45,
          precio: 35000,
          descripcion: "Diseño personalizado según el rostro",
          imagen: "/img/diseno-cejas.jpg"
        }
      ];

      for (const servicio of serviciosDefault) {
        await db.run(
          "INSERT INTO servicios (nombre, duracion, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)",
          [servicio.nombre, servicio.duracion, servicio.precio, servicio.descripcion, servicio.imagen]
        );
      }
      console.log("✅ Servicios de ejemplo insertados");
    }

    // 4. Crear tabla nomina (si se necesita)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS nomina (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lavador_id INTEGER NOT NULL,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        total_citas INTEGER DEFAULT 0,
        total_ganancia REAL DEFAULT 0,
        comisiones_generadas REAL DEFAULT 0,
        estado TEXT DEFAULT 'pendiente',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lavador_id) REFERENCES lavadores(id),
        UNIQUE(lavador_id, mes, ano)
      )
    `);
    console.log("✅ Tabla 'nomina' creada");

    console.log("\n🎉 Base de datos inicializada correctamente!");
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al inicializar base de datos:", error.message);
    process.exit(1);
  }
}

initAll();
