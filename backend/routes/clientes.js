// backend/routes/clientes.js
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import { enviarCuponLavadaGratis, generarCodigoCupon } from "../services/emailService.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;
(async () => {
  db = await open({
    filename: path.join(__dirname, "../database/database.sqlite"),
    driver: sqlite3.Database,
  });
})();

// Función auxiliar para registrar o actualizar cliente y verificar lavadas
// NOTA: Solo se cuentan citas normales (taller_id IS NULL), no talleres aliados
export async function procesarLavadaCliente(email, nombre, telefono) {
  if (!email || !nombre) {
    return { success: false, error: 'Email y nombre son requeridos' };
  }

  try {
    // Buscar o crear cliente
    let cliente = await db.get('SELECT * FROM clientes WHERE email = ?', [email]);
    
    if (!cliente) {
      // Crear nuevo cliente
      const result = await db.run(
        'INSERT INTO clientes (email, nombre, telefono, lavadas_completadas, lavadas_gratis_pendientes) VALUES (?, ?, ?, 0, 0)',
        [email, nombre, telefono || '']
      );
      cliente = {
        id: result.lastID,
        email,
        nombre,
        telefono: telefono || '',
        lavadas_completadas: 0,
        lavadas_gratis_pendientes: 0
      };
      console.log(`✅ Nuevo cliente creado: ${email}`);
    }

    // Incrementar lavadas completadas Y total histórico
    const nuevasLavadas = cliente.lavadas_completadas + 1;
    const totalHistorico = (cliente.total_lavadas_historico || 0) + 1;
    
    await db.run(
      'UPDATE clientes SET lavadas_completadas = ?, total_lavadas_historico = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nuevasLavadas, totalHistorico, cliente.id]
    );

    console.log(`📊 Cliente ${email}: ${nuevasLavadas} lavadas en ciclo actual, ${totalHistorico} totales`);

    // Verificar si alcanzó 10 lavadas (múltiplo de 10)
    if (nuevasLavadas > 0 && nuevasLavadas % 10 === 0) {
      console.log(`🎉 ¡Cliente ${email} alcanzó ${nuevasLavadas} lavadas! Generando cupón gratis...`);
      
      // Generar código de cupón
      const codigoCupon = generarCodigoCupon();
      
      // Guardar cupón en la base de datos
      const fechaEmision = new Date().toISOString().split('T')[0];
      await db.run(
        'INSERT INTO cupones (codigo, email_cliente, usado, fecha_emision) VALUES (?, ?, 0, ?)',
        [codigoCupon, email, fechaEmision]
      );

      // Incrementar lavadas gratis pendientes Y REINICIAR CONTADOR
      // Reiniciamos el contador a 0 para que empiece de nuevo el ciclo
      await db.run(
        'UPDATE clientes SET lavadas_completadas = 0, lavadas_gratis_pendientes = lavadas_gratis_pendientes + 1, ultima_lavada_gratis = ? WHERE id = ?',
        [fechaEmision, cliente.id]
      );

      // Enviar email con el cupón
      const resultadoEmail = await enviarCuponLavadaGratis(email, nombre, codigoCupon, nuevasLavadas);
      
      return {
        success: true,
        lavadas: nuevasLavadas,
        totalHistorico,
        lavadasActuales: 0, // Reiniciado
        cuponGenerado: true,
        codigoCupon,
        emailEnviado: resultadoEmail.success,
        mensaje: `¡Felicidades! Has completado ${totalHistorico} lavadas en total. Te hemos enviado un cupón de lavada gratis al correo ${email}. Tu contador se reinicia desde 0.`
      };
    }

    return {
      success: true,
      lavadas: nuevasLavadas,
      totalHistorico,
      cuponGenerado: false,
      mensaje: `Lavada registrada. Llevas ${nuevasLavadas} lavadas en el ciclo actual (${totalHistorico} totales). ${10 - nuevasLavadas} lavadas más para tu próximo cupón gratis.`
    };
  } catch (error) {
    console.error('❌ Error procesando lavada de cliente:', error);
    return { success: false, error: error.message };
  }
}

// GET - Obtener información de un cliente por email
router.get("/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: "Email es requerido" });
    }

    const cliente = await db.get('SELECT * FROM clientes WHERE email = ?', [email]);
    
    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Obtener cupones del cliente
    const cupones = await db.all(
      'SELECT * FROM cupones WHERE email_cliente = ? ORDER BY created_at DESC',
      [email]
    );

    res.json({
      ...cliente,
      cupones,
      progreso: {
        lavadas_completadas: cliente.lavadas_completadas,
        proxima_gratis: 10 - (cliente.lavadas_completadas % 10),
        lavadas_gratis_disponibles: cliente.lavadas_gratis_pendientes
      }
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET - Obtener todos los clientes
// NOTA: Las estadísticas solo incluyen citas normales (taller_id IS NULL)
router.get("/", async (req, res) => {
  try {
    const clientes = await db.all('SELECT * FROM clientes ORDER BY lavadas_completadas DESC');
    res.json(clientes);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST - Crear o actualizar cliente manualmente
router.post("/", async (req, res) => {
  try {
    const { email, nombre, telefono } = req.body;
    
    if (!email || !nombre) {
      return res.status(400).json({ error: "Email y nombre son requeridos" });
    }

    // Verificar si ya existe
    const existente = await db.get('SELECT id FROM clientes WHERE email = ?', [email]);
    
    if (existente) {
      // Actualizar
      await db.run(
        'UPDATE clientes SET nombre = ?, telefono = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
        [nombre, telefono || '', email]
      );
      return res.json({ message: "Cliente actualizado exitosamente" });
    } else {
      // Crear nuevo
      const result = await db.run(
        'INSERT INTO clientes (email, nombre, telefono, lavadas_completadas, lavadas_gratis_pendientes) VALUES (?, ?, ?, 0, 0)',
        [email, nombre, telefono || '']
      );
      return res.status(201).json({ id: result.lastID, message: "Cliente creado exitosamente" });
    }
  } catch (error) {
    console.error('Error creando/actualizando cliente:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET - Verificar cupón
router.get("/cupon/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const cupon = await db.get('SELECT * FROM cupones WHERE codigo = ?', [codigo]);
    
    if (!cupon) {
      return res.status(404).json({ error: "Cupón no encontrado" });
    }

    if (cupon.usado) {
      return res.json({
        valido: false,
        mensaje: "Este cupón ya fue utilizado",
        fecha_uso: cupon.fecha_uso
      });
    }

    res.json({
      valido: true,
      mensaje: "Cupón válido para lavada gratis",
      email_cliente: cupon.email_cliente,
      fecha_emision: cupon.fecha_emision
    });
  } catch (error) {
    console.error('Error verificando cupón:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST - Usar cupón
router.post("/cupon/:codigo/usar", async (req, res) => {
  try {
    const { codigo } = req.params;
    const { cita_id } = req.body;
    
    const cupon = await db.get('SELECT * FROM cupones WHERE codigo = ?', [codigo]);
    
    if (!cupon) {
      return res.status(404).json({ error: "Cupón no encontrado" });
    }

    if (cupon.usado) {
      return res.status(400).json({ error: "Este cupón ya fue utilizado" });
    }

    // Marcar cupón como usado
    const fechaUso = new Date().toISOString().split('T')[0];
    await db.run(
      'UPDATE cupones SET usado = 1, fecha_uso = ?, cita_id = ? WHERE codigo = ?',
      [fechaUso, cita_id || null, codigo]
    );

    // Decrementar lavadas gratis pendientes
    await db.run(
      'UPDATE clientes SET lavadas_gratis_pendientes = lavadas_gratis_pendientes - 1 WHERE email = ?',
      [cupon.email_cliente]
    );

    res.json({ message: "Cupón utilizado exitosamente", fecha_uso: fechaUso });
  } catch (error) {
    console.error('Error usando cupón:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
