// src/services/lavadoresService.js
// Use relative URLs - works in both dev (via Vite proxy) and prod (via Nginx proxy)
const API_URL = "/api/lavadores";

export async function getLavadores() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    console.error("Error fetching lavadores:", res.status);
    return [];
  }
  return res.json();
}

export async function getLavadoresActivos() {
  const res = await fetch(`${API_URL}/activos`);
  if (!res.ok) {
    console.error("Error fetching lavadores activos:", res.status);
    return [];
  }
  return res.json();
}

export async function addLavador(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || "Error al crear el lavador");
  }
  
  return result;
}

export async function updateLavador(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || "Error al actualizar el lavador");
  }
  
  return result;
}

export async function deleteLavador(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) {
    throw new Error("Error al eliminar el lavador");
  }
  
  return res.json();
}

export default {
  getLavadores,
  getLavadoresActivos,
  addLavador,
  updateLavador,
  deleteLavador,
};
