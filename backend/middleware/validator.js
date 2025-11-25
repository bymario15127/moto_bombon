// middleware/validator.js
import validator from 'validator';

// Validación de inputs para prevenir inyecciones
export const validateCita = (req, res, next) => {
  const { cliente, fecha, telefono, email } = req.body;
  
  // Validar cliente (solo letras y espacios)
  if (!cliente || typeof cliente !== 'string' || cliente.trim().length < 2) {
    return res.status(400).json({ error: 'Nombre de cliente inválido' });
  }
  
  // Validar fecha (formato YYYY-MM-DD)
  if (!fecha || !validator.isDate(fecha)) {
    return res.status(400).json({ error: 'Fecha inválida' });
  }
  
  // Validar teléfono (opcional)
  if (telefono && !validator.isMobilePhone(telefono, 'any')) {
    return res.status(400).json({ error: 'Teléfono inválido' });
  }
  
  // Validar email (opcional)
  if (email && !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  next();
};

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return validator.escape(str.trim());
};

export const validateServicio = (req, res, next) => {
  const { nombre, duracion, precio } = req.body;
  
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
    return res.status(400).json({ error: 'Nombre de servicio inválido' });
  }
  
  if (!duracion || !Number.isInteger(Number(duracion)) || Number(duracion) < 1) {
    return res.status(400).json({ error: 'Duración inválida' });
  }
  
  if (!precio || isNaN(Number(precio)) || Number(precio) < 0) {
    return res.status(400).json({ error: 'Precio inválido' });
  }
  
  next();
};

export const validateLavador = (req, res, next) => {
  const { nombre, cedula, comision_porcentaje } = req.body;
  
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    return res.status(400).json({ error: 'Nombre inválido' });
  }
  
  if (!cedula || typeof cedula !== 'string' || cedula.trim().length < 5) {
    return res.status(400).json({ error: 'Cédula inválida' });
  }
  
  if (comision_porcentaje !== undefined) {
    const comision = Number(comision_porcentaje);
    if (isNaN(comision) || comision < 0 || comision > 100) {
      return res.status(400).json({ error: 'Porcentaje de comisión inválido (0-100)' });
    }
  }
  
  next();
};
