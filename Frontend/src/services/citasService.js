// Use relative URLs - works in both dev (via Vite proxy) and prod (via Nginx proxy)
const API_URL = "/api/citas";

export async function getCitas() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    console.error("Error fetching citas:", res.status);
    return []; // Return empty array on error
  }
  return res.json();
}

export async function addCita(data, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers['x-access-token'] = token;

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
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
