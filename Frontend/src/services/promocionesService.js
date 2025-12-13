// Frontend/src/services/promocionesService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const getPromociones = async (incluirInactivas = false) => {
  const url = incluirInactivas 
    ? `${API_URL}/api/promociones?all=true`
    : `${API_URL}/api/promociones`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al obtener promociones");
  return response.json();
};

export const getPromocionesVigentes = async () => {
  const response = await fetch(`${API_URL}/api/promociones/vigentes`);
  if (!response.ok) throw new Error("Error al obtener promociones vigentes");
  return response.json();
};

export const createPromocion = async (promocion) => {
  const response = await fetch(`${API_URL}/api/promociones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(promocion),
  });
  if (!response.ok) throw new Error("Error al crear promoción");
  return response.json();
};

export const updatePromocion = async (id, promocion) => {
  const response = await fetch(`${API_URL}/api/promociones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(promocion),
  });
  if (!response.ok) throw new Error("Error al actualizar promoción");
  return response.json();
};

export const deletePromocion = async (id) => {
  const response = await fetch(`${API_URL}/api/promociones/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al desactivar promoción");
  return response.json();
};
