// src/services/serviciosService.js
// Use relative URLs - works in both dev (via Vite proxy) and prod (via Nginx proxy)
const API_URL = "/api/servicios";
const UPLOAD_URL = "/api/upload-image";

// Cache para servicios (se actualiza cada 5 minutos)
let serviciosCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function getServicios() {
  const now = Date.now();
  
  // Si hay cache válido, devolverlo
  if (serviciosCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return serviciosCache;
  }
  
  const res = await fetch(API_URL);
  if (!res.ok) {
    console.error("Error fetching servicios:", res.status);
    return serviciosCache || []; // Return cached data if available, else empty array
  }
  
  const data = await res.json();
  serviciosCache = data;
  cacheTimestamp = now;
  
  return data;
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
  try {
    console.log("📤 Iniciando upload de imagen, tamaño:", dataUrl.length);
    
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl }),
    });
    
    console.log("📊 Respuesta del servidor:", res.status, res.statusText);
    
    const result = await res.json();
    
    console.log("📋 Resultado del JSON:", result);
    
    if (!res.ok) {
      console.error("❌ Error en upload:", result.error);
      throw new Error(result.error || "Error al subir la imagen");
    }
    
    console.log("✅ Imagen subida exitosamente:", result.url);
    return result; // { url }
  } catch (error) {
    console.error("🔴 Error en uploadImagen:", error);
    throw error;
  }
}

export default {
  getServicios,
  addServicio,
  updateServicio,
  deleteServicio,
  uploadImagen,
};