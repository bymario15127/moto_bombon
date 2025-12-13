// src/components/admin/PromocionesManager.jsx
import { useState, useEffect } from "react";
import * as promocionesService from "../../services/promocionesService";
import { uploadImagen } from "../../services/serviciosService";

export default function PromocionesManager() {
  const [promociones, setPromociones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
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
    fecha_fin: "",
    imagen: "/img/default.jpg",
    imagen_bajo_cc: "",
    imagen_alto_cc: ""
  });

  useEffect(() => {
    loadPromociones();
  }, []);

  const loadPromociones = async () => {
    try {
      const data = await promocionesService.getPromociones(true); // Incluir todas
      setPromociones(data);
    } catch (error) {
      console.error("Error al cargar promociones:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log("📤 Enviando formData:", formData);
      
      const promoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio_cliente_bajo_cc: formData.precio_cliente_bajo_cc ? parseFloat(formData.precio_cliente_bajo_cc) : null,
        precio_cliente_alto_cc: formData.precio_cliente_alto_cc ? parseFloat(formData.precio_cliente_alto_cc) : null,
        precio_comision_bajo_cc: parseFloat(formData.precio_comision_bajo_cc),
        precio_comision_alto_cc: parseFloat(formData.precio_comision_alto_cc),
        duracion: parseInt(formData.duracion),
        activo: formData.activo ? 1 : 0,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        imagen: formData.imagen,
        imagen_bajo_cc: formData.imagen_bajo_cc,
        imagen_alto_cc: formData.imagen_alto_cc
      };

      console.log("📤 PromoData a enviar:", promoData);

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
      duracion: promo.duracion.toString(),
      activo: promo.activo === 1,
      fecha_inicio: promo.fecha_inicio || "",
      fecha_fin: promo.fecha_fin || "",
      imagen: promo.imagen || "/img/default.jpg",
      imagen_bajo_cc: promo.imagen_bajo_cc || "",
      imagen_alto_cc: promo.imagen_alto_cc || ""
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
      fecha_fin: "",
      imagen: "/img/default.jpg",
      imagen_bajo_cc: "",
      imagen_alto_cc: ""
    });
    setEditingPromo(null);
    setShowForm(false);
  };

  const formatPrecio = (precio) => {
    if (!precio) return "N/A";
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="servicios-manager">
      <div className="servicios-header">
        <h1>🎁 Gestión de Promociones</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Nueva Promoción
        </button>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-group">
                <label>Nombre de la promoción</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: GOLD NAVIDEÑO"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duración (minutos)</label>
                  <input
                    type="number"
                    value={formData.duracion}
                    onChange={(e) => setFormData({...formData, duracion: e.target.value})}
                    min="15"
                    max="300"
                    step="15"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    />
                    Promoción Activa
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows="2"
                  placeholder="Descripción de la promoción"
                />
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '10px', color: '#333' }}>💰 Precios para el Cliente</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                Lo que el cliente pagará por el servicio
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio Bajo CC (100-405cc)</label>
                  <input
                    type="number"
                    value={formData.precio_cliente_bajo_cc}
                    onChange={(e) => setFormData({...formData, precio_cliente_bajo_cc: e.target.value})}
                    min="0"
                    step="1000"
                    placeholder="Ej: 25000"
                  />
                </div>

                <div className="form-group">
                  <label>Precio Alto CC (405-1200cc)</label>
                  <input
                    type="number"
                    value={formData.precio_cliente_alto_cc}
                    onChange={(e) => setFormData({...formData, precio_cliente_alto_cc: e.target.value})}
                    min="0"
                    step="1000"
                    placeholder="Ej: 28000"
                  />
                </div>
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '10px', color: '#333' }}>👤 Precios Base para Comisión del Lavador</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                Sobre qué monto se calculará la comisión del lavador
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio Base Bajo CC *</label>
                  <input
                    type="number"
                    value={formData.precio_comision_bajo_cc}
                    onChange={(e) => setFormData({...formData, precio_comision_bajo_cc: e.target.value})}
                    min="0"
                    step="1000"
                    placeholder="Ej: 45000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio Base Alto CC *</label>
                  <input
                    type="number"
                    value={formData.precio_comision_alto_cc}
                    onChange={(e) => setFormData({...formData, precio_comision_alto_cc: e.target.value})}
                    min="0"
                    step="1000"
                    placeholder="Ej: 45000"
                    required
                  />
                </div>
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '10px', color: '#333' }}>📅 Vigencia</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Fin</label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                  />
                </div>
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '10px', color: '#333' }}>🖼️ Imágenes</h3>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Imagen Principal (Vista general)</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (ev) => {
                    try {
                      const dataUrl = ev.target.result;
                      const { url } = await uploadImagen(dataUrl);
                      console.log("✅ Imagen principal subida:", url);
                      setFormData((prev) => ({ ...prev, imagen: url }));
                    } catch (err) {
                      console.error('Error subiendo imagen principal:', err);
                      alert('No se pudo subir la imagen');
                    }
                  };
                  reader.readAsDataURL(file);
                }} />
                {formData.imagen && formData.imagen !== '/img/default.jpg' && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                    <img src={formData.imagen} alt="preview imagen principal" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '2px solid #EB0463' }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>✓ Imagen cargada</span>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Imagen para Bajo CC (100-405cc)</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      try {
                        const dataUrl = ev.target.result;
                        const { url } = await uploadImagen(dataUrl);
                        setFormData((prev) => ({ ...prev, imagen_bajo_cc: url }));
                      } catch (err) {
                        console.error('Error subiendo imagen:', err);
                        alert('No se pudo subir la imagen');
                      }
                    };
                    reader.readAsDataURL(file);
                  }} />
                  {formData.imagen_bajo_cc && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                      <img src={formData.imagen_bajo_cc} alt="preview bajo cc" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #EB0463' }} />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>✓ Imagen cargada</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Imagen para Alto CC (405-1200cc)</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      try {
                        const dataUrl = ev.target.result;
                        const { url } = await uploadImagen(dataUrl);
                        setFormData((prev) => ({ ...prev, imagen_alto_cc: url }));
                      } catch (err) {
                        console.error('Error subiendo imagen:', err);
                        alert('No se pudo subir la imagen');
                      }
                    };
                    reader.readAsDataURL(file);
                  }} />
                  {formData.imagen_alto_cc && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                      <img src={formData.imagen_alto_cc} alt="preview alto cc" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #EB0463' }} />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>✓ Imagen cargada</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingPromo ? 'Actualizar' : 'Crear'} Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de promociones */}
      <div className="servicios-grid">
        {promociones.map(promo => (
          <div key={promo.id} className={`service-card ${promo.activo ? '' : 'inactive'}`}>
            {!promo.activo && (
              <div style={{ position: 'absolute', top: 10, right: 10, background: '#999', color: '#fff', fontSize: '11px', padding: '4px 8px', borderRadius: 4, zIndex: 1 }}>
                Inactiva
              </div>
            )}
            
            <div className="service-images">
              {promo.imagen_bajo_cc && promo.imagen_alto_cc ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <img src={promo.imagen_bajo_cc} alt={`${promo.nombre} bajo CC`} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
                    <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: 4 }}>Bajo CC</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <img src={promo.imagen_alto_cc} alt={`${promo.nombre} alto CC`} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
                    <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: 4 }}>Alto CC</span>
                  </div>
                </div>
              ) : (
                <img src={promo.imagen || '/img/default.jpg'} alt={promo.nombre} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
              )}
            </div>
            
            <div className="service-content">
              <h3>🎁 {promo.nombre}</h3>
              {promo.descripcion && <p className="service-description">{promo.descripcion}</p>}
              
              <div className="service-details">
                <div className="service-detail">
                  <span className="detail-icon">⏱️</span>
                  <span>{promo.duracion} min</span>
                </div>
                <div className="service-detail">
                  <span className="detail-icon">💰</span>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                    <span style={{fontSize: '11px', color: '#666'}}>Cliente paga:</span>
                    <span style={{fontSize: '12px'}}>Bajo: {formatPrecio(promo.precio_cliente_bajo_cc)}</span>
                    <span style={{fontSize: '12px'}}>Alto: {formatPrecio(promo.precio_cliente_alto_cc)}</span>
                  </div>
                </div>
                <div className="service-detail">
                  <span className="detail-icon">👤</span>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                    <span style={{fontSize: '11px', color: '#666'}}>Comisión sobre:</span>
                    <span style={{fontSize: '12px', fontWeight: '500', color: '#2196F3'}}>
                      {formatPrecio(promo.precio_comision_bajo_cc)} / {formatPrecio(promo.precio_comision_alto_cc)}
                    </span>
                  </div>
                </div>
                {(promo.fecha_inicio || promo.fecha_fin) && (
                  <div className="service-detail">
                    <span className="detail-icon">📅</span>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                      {promo.fecha_inicio && <span style={{fontSize: '11px'}}>Desde: {formatDate(promo.fecha_inicio)}</span>}
                      {promo.fecha_fin && <span style={{fontSize: '11px'}}>Hasta: {formatDate(promo.fecha_fin)}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="service-actions">
              <button 
                className="btn-edit"
                onClick={() => handleEdit(promo)}
              >
                ✏️ Editar
              </button>
              {promo.activo && (
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(promo.id)}
                >
                  🗑️ Desactivar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {promociones.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎁</div>
          <h3>No hay promociones registradas</h3>
          <p>Comienza agregando tu primera promoción especial</p>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <h4 style={{ marginBottom: '12px', color: '#333' }}>💡 Cómo funcionan las promociones</h4>
        <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8', marginLeft: '20px' }}>
          <li><strong>Precio Cliente:</strong> Lo que el cliente paga por el servicio promocional</li>
          <li><strong>Precio Comisión:</strong> El monto sobre el cual se calcula la comisión del lavador</li>
          <li><strong>Ejemplo:</strong> Cliente paga $25,000 pero la comisión del lavador se calcula sobre $45,000</li>
          <li><strong>Vigencia:</strong> Define el período en que la promoción estará disponible</li>
          <li><strong>Imágenes:</strong> Puedes subir imágenes específicas para cada cilindraje</li>
        </ul>
      </div>
    </div>
  );
}
