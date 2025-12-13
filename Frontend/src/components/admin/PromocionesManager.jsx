// src/components/admin/PromocionesManager.jsx
import { useState, useEffect } from "react";
import * as promocionesService from "../../services/promocionesService";

export default function PromocionesManager() {
  const [promociones, setPromociones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [incluirInactivas, setIncluirInactivas] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio_cliente_bajo_cc: "",
    precio_cliente_alto_cc: "",
    precio_comision_bajo_cc: "",
    precio_comision_alto_cc: "",
    duracion: "",
    activo: true,
    fecha_inicio: "",
    fecha_fin: ""
  });

  useEffect(() => {
    loadPromociones();
  }, [incluirInactivas]);

  const loadPromociones = async () => {
    try {
      const data = await promocionesService.getPromociones(incluirInactivas);
      setPromociones(data);
    } catch (error) {
      console.error("Error al cargar promociones:", error);
      alert("Error al cargar promociones");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const promoData = {
        ...formData,
        duracion: parseInt(formData.duracion),
        precio_cliente_bajo_cc: formData.precio_cliente_bajo_cc ? parseFloat(formData.precio_cliente_bajo_cc) : null,
        precio_cliente_alto_cc: formData.precio_cliente_alto_cc ? parseFloat(formData.precio_cliente_alto_cc) : null,
        precio_comision_bajo_cc: parseFloat(formData.precio_comision_bajo_cc),
        precio_comision_alto_cc: parseFloat(formData.precio_comision_alto_cc),
        activo: formData.activo ? 1 : 0,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null
      };

      if (editingPromo) {
        await promocionesService.updatePromocion(editingPromo.id, promoData);
        alert("Promoción actualizada exitosamente");
      } else {
        await promocionesService.createPromocion(promoData);
        alert("Promoción creada exitosamente");
      }
      
      resetForm();
      loadPromociones();
    } catch (error) {
      console.error("Error al guardar promoción:", error);
      alert("Error al guardar la promoción");
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      nombre: promo.nombre,
      descripcion: promo.descripcion || "",
      precio_cliente_bajo_cc: promo.precio_cliente_bajo_cc || "",
      precio_cliente_alto_cc: promo.precio_cliente_alto_cc || "",
      precio_comision_bajo_cc: promo.precio_comision_bajo_cc,
      precio_comision_alto_cc: promo.precio_comision_alto_cc,
      duracion: promo.duracion,
      activo: promo.activo === 1,
      fecha_inicio: promo.fecha_inicio || "",
      fecha_fin: promo.fecha_fin || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Desactivar esta promoción?")) return;
    
    try {
      await promocionesService.deletePromocion(id);
      alert("Promoción desactivada");
      loadPromociones();
    } catch (error) {
      console.error("Error al desactivar promoción:", error);
      alert("Error al desactivar la promoción");
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      precio_cliente_bajo_cc: "",
      precio_cliente_alto_cc: "",
      precio_comision_bajo_cc: "",
      precio_comision_alto_cc: "",
      duracion: "",
      activo: true,
      fecha_inicio: "",
      fecha_fin: ""
    });
    setEditingPromo(null);
    setShowForm(false);
  };

  const formatCurrency = (value) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Sin límite";
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO');
  };

  return (
    <div className="content-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🎁 Gestión de Promociones</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input 
              type="checkbox" 
              checked={incluirInactivas}
              onChange={(e) => setIncluirInactivas(e.target.checked)}
            />
            Ver inactivas
          </label>
          <button 
            className="btn-primary" 
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '8px 16px' }}
          >
            {showForm ? "Cancelar" : "+ Nueva Promoción"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: '30px' }}>
          <h3>{editingPromo ? "Editar Promoción" : "Nueva Promoción"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: GOLD NAVIDEÑO"
                />
              </div>

              <div className="form-group">
                <label>Duración (min) *</label>
                <input
                  type="number"
                  required
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                  placeholder="Ej: 90"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="2"
                  placeholder="Descripción de la promoción"
                />
              </div>

              <div style={{ gridColumn: '1 / -1', borderTop: '2px solid #e0e0e0', paddingTop: '15px' }}>
                <h4 style={{ marginBottom: '10px' }}>💰 Precios para el Cliente</h4>
                <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
                  Estos son los precios que el cliente pagará (opcional, si vacío se cobra precio normal)
                </small>
              </div>

              <div className="form-group">
                <label>Precio Bajo Cilindraje (100-405cc)</label>
                <input
                  type="number"
                  value={formData.precio_cliente_bajo_cc}
                  onChange={(e) => setFormData({ ...formData, precio_cliente_bajo_cc: e.target.value })}
                  placeholder="Ej: 25000"
                />
              </div>

              <div className="form-group">
                <label>Precio Alto Cilindraje (406-1200cc)</label>
                <input
                  type="number"
                  value={formData.precio_cliente_alto_cc}
                  onChange={(e) => setFormData({ ...formData, precio_cliente_alto_cc: e.target.value })}
                  placeholder="Ej: 28000"
                />
              </div>

              <div style={{ gridColumn: '1 / -1', borderTop: '2px solid #e0e0e0', paddingTop: '15px' }}>
                <h4 style={{ marginBottom: '10px' }}>👤 Precios Base para Comisión</h4>
                <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
                  Estos son los precios sobre los que se calculará la comisión del lavador *
                </small>
              </div>

              <div className="form-group">
                <label>Precio Base Bajo CC (Comisión) *</label>
                <input
                  type="number"
                  required
                  value={formData.precio_comision_bajo_cc}
                  onChange={(e) => setFormData({ ...formData, precio_comision_bajo_cc: e.target.value })}
                  placeholder="Ej: 45000"
                />
              </div>

              <div className="form-group">
                <label>Precio Base Alto CC (Comisión) *</label>
                <input
                  type="number"
                  required
                  value={formData.precio_comision_alto_cc}
                  onChange={(e) => setFormData({ ...formData, precio_comision_alto_cc: e.target.value })}
                  placeholder="Ej: 45000"
                />
              </div>

              <div style={{ gridColumn: '1 / -1', borderTop: '2px solid #e0e0e0', paddingTop: '15px' }}>
                <h4 style={{ marginBottom: '10px' }}>📅 Vigencia</h4>
              </div>

              <div className="form-group">
                <label>Fecha Inicio</label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Fecha Fin</label>
                <input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  Promoción Activa
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn-primary">
                {editingPromo ? "Actualizar" : "Crear"} Promoción
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Duración</th>
              <th>Precio Cliente</th>
              <th>Precio Comisión</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promociones.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No hay promociones {incluirInactivas ? '' : 'activas'}
                </td>
              </tr>
            ) : (
              promociones.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <strong>{promo.nombre}</strong>
                    {promo.descripcion && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {promo.descripcion}
                      </div>
                    )}
                  </td>
                  <td>{promo.duracion} min</td>
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      <div>Bajo CC: {formatCurrency(promo.precio_cliente_bajo_cc)}</div>
                      <div>Alto CC: {formatCurrency(promo.precio_cliente_alto_cc)}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#2196F3' }}>
                      <div>Bajo CC: {formatCurrency(promo.precio_comision_bajo_cc)}</div>
                      <div>Alto CC: {formatCurrency(promo.precio_comision_alto_cc)}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    <div>Inicio: {formatDate(promo.fecha_inicio)}</div>
                    <div>Fin: {formatDate(promo.fecha_fin)}</div>
                  </td>
                  <td>
                    <span className={`badge ${promo.activo ? 'badge-success' : 'badge-danger'}`}>
                      {promo.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleEdit(promo)}
                        className="btn-icon"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      {promo.activo && (
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="btn-icon btn-danger"
                          title="Desactivar"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px' }}>💡 Cómo funciona</h4>
        <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
          <li><strong>Precio Cliente:</strong> Lo que el cliente paga (puede ser menor que el precio normal)</li>
          <li><strong>Precio Comisión:</strong> El monto base sobre el cual se calcula la comisión del lavador</li>
          <li><strong>Ejemplo:</strong> Cliente paga $25,000 pero la comisión se calcula sobre $45,000</li>
          <li><strong>Vigencia:</strong> Define el período en que la promoción estará disponible para nuevas citas</li>
        </ul>
      </div>
    </div>
  );
}
