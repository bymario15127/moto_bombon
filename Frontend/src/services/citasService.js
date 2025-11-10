// Use relative URL so Vite dev proxy can forward to backend
// In production, will use VITE_API_URL from env vars
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/citas`
  : "/api/citas";

export async function getCitas() {
  const res = await fetch(API_URL);
  return res.json();
}

export async function addCita(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || "Error al crear la cita");
  }
  
  return result;
}

export async function getHorariosOcupados(fecha) {
  const res = await fetch(`${API_URL}/ocupados/${fecha}`);
  if (!res.ok) {
    throw new Error("Error al obtener horarios ocupados");
  }
  return res.json();
}

export async function deleteCita(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
}

export async function updateCita(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
