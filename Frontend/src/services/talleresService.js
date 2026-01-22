// Frontend/src/services/talleresService.js
class TalleresService {
  async getTalleres() {
    const response = await fetch('http://localhost:3000/api/talleres');
    if (!response.ok) throw new Error('Error al obtener talleres');
    return response.json();
  }

  async getTalleresAdmin() {
    const response = await fetch('/api/talleres/admin/all');
    if (!response.ok) throw new Error('Error al obtener talleres');
    return response.json();
  }

  async createTaller(data) {
    const response = await fetch('/api/talleres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear taller');
    return response.json();
  }

  async updateTaller(id, data) {
    const response = await fetch(`/api/talleres/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar taller');
    return response.json();
  }

  async deleteTaller(id) {
    const response = await fetch(`/api/talleres/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar taller');
    return response.json();
  }
}

export default new TalleresService();
