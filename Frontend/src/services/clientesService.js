// Frontend/src/services/clientesService.js
const API_URL = "/api/clientes";

// Obtener todos los clientes ordenados por lavadas
export const getClientes = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener clientes");
  }
  return response.json();
};

// Obtener información de un cliente por email
export const getClienteByEmail = async (email) => {
  const response = await fetch(`${API_URL}/email/${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error("Error al obtener cliente");
  }
  return response.json();
};

// Verificar un cupón
export const verificarCupon = async (codigo) => {
  const response = await fetch(`${API_URL}/cupon/${codigo}`);
  if (!response.ok) {
    throw new Error("Error al verificar cupón");
  }
  return response.json();
};

// Usar/redimir un cupón
export const usarCupon = async (codigo, citaId = null) => {
  const response = await fetch(`${API_URL}/cupon/${codigo}/usar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cita_id: citaId }),
  });
  if (!response.ok) {
    throw new Error("Error al usar cupón");
  }
  return response.json();
};

// Crear o actualizar cliente
export const guardarCliente = async (cliente) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cliente),
  });
  if (!response.ok) {
    throw new Error("Error al guardar cliente");
  }
  return response.json();
};
