// src/services/productosService.js
const API_URL = "/api/productos";

const getAuthHeader = () => {
  const token = localStorage.getItem("motobombon_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
};

export const obtenerProductos = async () => {
  try {
    const response = await fetch(API_URL, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error("Error obteniendo productos");
    return response.json();
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    throw error;
  }
};

export const crearProducto = async (producto) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(producto)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error creando producto");
    }
    return response.json();
  } catch (error) {
    console.error("Error creando producto:", error);
    throw error;
  }
};

export const actualizarProducto = async (id, producto) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify(producto)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error actualizando producto");
    }
    return response.json();
  } catch (error) {
    console.error("Error actualizando producto:", error);
    throw error;
  }
};

export const eliminarProducto = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeader()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error eliminando producto");
    }
    return response.json();
  } catch (error) {
    console.error("Error eliminando producto:", error);
    throw error;
  }
};

export const registrarVenta = async (producto_id, cantidad) => {
  try {
    const response = await fetch(`${API_URL}/venta/registrar`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({
        producto_id,
        cantidad
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error registrando venta");
    }
    return response.json();
  } catch (error) {
    console.error("Error registrando venta:", error);
    throw error;
  }
};

export const obtenerReporteDiario = async (fecha = null) => {
  try {
    const params = fecha ? `?fecha=${fecha}` : "";
    const response = await fetch(`${API_URL}/reportes/diarias${params}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error("Error obteniendo reporte diario");
    return response.json();
  } catch (error) {
    console.error("Error obteniendo reporte diario:", error);
    throw error;
  }
};

export const obtenerReporteGanancias = async (desde = null, hasta = null) => {
  try {
    const params = new URLSearchParams();
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_URL}/reportes/ganancias${queryString}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error("Error obteniendo reporte de ganancias");
    return response.json();
  } catch (error) {
    console.error("Error obteniendo reporte de ganancias:", error);
    throw error;
  }
};

export const eliminarVenta = async (id) => {
  try {
    const response = await fetch(`${API_URL}/venta/${id}`, {
      method: "DELETE",
      headers: getAuthHeader()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error eliminando venta");
    }
    return response.json();
  } catch (error) {
    console.error("Error eliminando venta:", error);
    throw error;
  }
};
