// src/services/serviciosService.js
// Use relative URL so Vite dev proxy can forward to backend
// In production, will use VITE_API_URL from env vars
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/servicios`
  : "/api/servicios";

const UPLOAD_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/upload-image`
  : "/api/upload-image";

export async function getServicios() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error("Error al obtener servicios");
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