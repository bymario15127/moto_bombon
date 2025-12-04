// src/services/serviciosService.js
// Use relative URLs - works in both dev (via Vite proxy) and prod (via Nginx proxy)
const API_URL = "/api/servicios";
const UPLOAD_URL = "/api/upload-image";

export async function getServicios() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    console.error("Error fetching servicios:", res.status);
    return []; // Return empty array on error instead of throwing
  }
  return res.json();
}

export async function addServicio(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || "Error al crear el servicio");
  }
  
  return result;
}

export async function updateServicio(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || "Error al actualizar el servicio");
  }
  
  return result;
}

export async function deleteServicio(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) {
    throw new Error("Error al eliminar el servicio");
  }
  
  return res.json();
}

// Sube una imagen en formato dataURL (base64) y devuelve { url }
export async function uploadImagen(dataUrl) {
  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl }),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || "Error al subir la imagen");
  }
  return result; // { url }
}

export default {
  getServicios,
  addServicio,
  updateServicio,
  deleteServicio,
  uploadImagen,
};