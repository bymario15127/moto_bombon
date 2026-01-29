// backend/scripts/reenviarCupon.js
// Script para reenviar cupón a un cliente específico
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { enviarCuponLavadaGratis } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la ruta correcta
dotenv.config({ path: path.join(__dirname, '../.env') });

async function reenviarCupon(codigoCupon) {
  let db;
  
  try {
    // Conectar a la base de datos
    db = await open({
      filename: path.join(__dirname, '../database/database.sqlite'),
      driver: sqlite3.Database,
    });

    console.log('🔍 Buscando cupón:', codigoCupon);

    // Buscar el cupón en la base de datos
    const cupon = await db.get(
      'SELECT * FROM cupones WHERE codigo = ?',
      [codigoCupon]
    );

    if (!cupon) {
      console.error('❌ Cupón no encontrado:', codigoCupon);
      return;
    }

    console.log('✅ Cupón encontrado:', cupon);

    // Buscar el cliente
    const cliente = await db.get(
      'SELECT * FROM clientes WHERE email = ?',
      [cupon.email_cliente]
    );

    if (!cliente) {
      console.error('❌ Cliente no encontrado:', cupon.email_cliente);
      return;
    }

    console.log('✅ Cliente encontrado:', cliente.nombre, '-', cliente.email);

    // Calcular las lavadas que tenía cuando ganó el cupón
    // Como el contador se reinicia, usamos el total histórico
    const lavadasCuandoGano = cliente.total_lavadas_historico || 10;

    console.log('📧 Enviando cupón por email...');

    // Reenviar el email
    const resultado = await enviarCuponLavadaGratis(
      cliente.email,
      cliente.nombre,
      cupon.codigo,
      lavadasCuandoGano
    );

    if (resultado.success) {
      console.log('✅ ¡Email enviado exitosamente!');
      console.log('📨 Message ID:', resultado.messageId);
    } else {
      console.error('❌ Error enviando email:', resultado.error || resultado.reason);
      if (resultado.reason === 'smtp_not_configured') {
        console.log('⚠️ Por favor, configura las variables SMTP en el archivo .env');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

// Obtener el código del cupón desde los argumentos de la línea de comandos
const codigoCupon = process.argv[2];

if (!codigoCupon) {
  console.log('❌ Uso: node reenviarCupon.js CODIGO-CUPON');
  console.log('📝 Ejemplo: node reenviarCupon.js MOTO-AYP4');
  process.exit(1);
}

// Ejecutar
reenviarCupon(codigoCupon);
