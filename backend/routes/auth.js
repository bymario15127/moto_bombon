// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-este-secret-en-produccion';

// Base de datos de usuarios (en producción, esto debería estar en la DB)
const users = {
  admin: {
    passwordHash: process.env.ADMIN_PASSWORD_HASH || '$2b$10$ejemplo', // Cambiar en .env
    role: 'admin',
    name: 'Paula Espinosa'
  },
  supervisor: {
    passwordHash: process.env.SUPERVISOR_PASSWORD_HASH || '$2b$10$ejemplo', // Cambiar en .env
    role: 'supervisor',
    name: 'Supervisor'
  }
};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    
    const user = users[username.toLowerCase()];
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Comparar contraseña con hash
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar JWT
    const token = jwt.sign(
      { username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' } // Token válido por 8 horas
    );
    
    res.json({
      token,
      user: {
        username,
        role: user.role,
        name: user.name
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido', valid: false });
  }
});

export default router;
