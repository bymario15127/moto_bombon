# 📦 Módulo de Productos y Ventas

## Descripción

Este módulo permite gestionar bebidas y productos del motolavado. Solo es visible para la **dueña y supervisora**.

### Características principales:

✅ **Gestión de Productos**
- Registrar bebidas con precio de compra y venta
- Editar productos existentes
- Eliminar productos
- Controlar stock

✅ **Registro de Ventas**
- Registrar ventas de productos de forma rápida
- El sistema reduce automáticamente el stock
- Calcula automáticamente la ganancia por venta

✅ **Reportes y Ganancias**
- Ver ventas del día por fecha
- Calcular ganancia neta (Precio de Venta - Precio de Compra)
- Reportes por período

---

## 🚀 Instalación

### 1. Inicializar la base de datos

Ejecuta el archivo `init-productos.bat` en la raíz del proyecto:

```bash
init-productos.bat
```

O manualmente desde el backend:

```bash
cd backend
node database/initProductos.js
```

### 2. Verificar la instalación

El script creará dos tablas en la base de datos SQLite:
- **productos**: Almacena los productos con sus precios
- **ventas**: Registra todas las transacciones

---

## 📱 Uso del Sistema

### Acceso

1. Ingresa como **Administrador** o **Supervisor**
2. En el menú lateral, busca **"📦 Productos"**
3. Se abrirán 3 tabs principales

### Tab 1: 📦 Productos

Aquí gestiona el catálogo de bebidas:

#### Crear producto:
```
Nombre: Coca Cola 350ml
Precio Compra: $2,000
Precio Venta: $5,000
Stock: 10
```

El sistema calcula automáticamente el **margen de ganancia** (en porcentaje).

#### Acciones:
- ✏️ **Editar**: Cambiar precio o stock
- 🗑️ **Eliminar**: Quitar producto del sistema

---

### Tab 2: 💰 Registrar Venta

Cuando un cliente compra una bebida:

1. Selecciona el producto del dropdown
2. Ingresa la cantidad
3. Haz clic en "Registrar Venta"
4. El sistema:
   - Descuenta el stock automáticamente
   - Registra quién hizo la venta (automático)
   - Calcula la ganancia

**Ejemplo:**
- Cliente compra 2 Coca Colas
- Precio de venta: $5,000 cada una
- Total venta: $10,000
- Ganancia por venta: $6,000 (($5,000-$2,000) × 2)

---

### Tab 3: 📊 Reportes

(Próximamente) Verás un resumen detallado de:
- Total de ventas por día
- Ganancia neta
- Productos más vendidos

---

## 💡 Ejemplo Práctico

### Escenario: Vender bebidas en el motolavado

**Paso 1: Registrar productos (Primero y una sola vez)**
```
Producto 1: Coca Cola 350ml
- Compra en: $2,000
- Vendo en: $5,000
- Stock inicial: 10

Producto 2: Cerveza Corona
- Compra en: $5,000
- Vendo en: $12,000
- Stock inicial: 5
```

**Paso 2: Registrar una venta**
```
Cliente llega y compra:
- 1 Coca Cola
- 1 Corona

Acción:
1. Ir a tab "Registrar Venta"
2. Seleccionar Coca Cola, cantidad 1 → Registrar
3. Seleccionar Corona, cantidad 1 → Registrar

Resultado:
- Stock de Coca Cola: 9
- Stock de Corona: 4
- Total ingresos: $17,000
- Ganancia neta: $10,000
```

---

## 🔐 Seguridad y Permisos

- ✅ Solo **Admin** y **Supervisor** ven este módulo
- ✅ No aparece en la app de cliente
- ✅ No aparece en la app de lavadores
- ✅ Todas las ventas quedan registradas con quién las hizo

---

## 🛠️ API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/productos` | Listar todos los productos |
| POST | `/api/productos` | Crear nuevo producto |
| PUT | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Eliminar producto |
| POST | `/api/productos/venta/registrar` | Registrar una venta |
| GET | `/api/productos/reportes/diarias` | Reportes de ventas del día |
| GET | `/api/productos/reportes/ganancias` | Reportes de ganancias por período |

---

## 📊 Fórmulas usadas

### Margen de Ganancia (%)
```
Margen = ((Precio Venta - Precio Compra) / Precio Compra) × 100
```

### Ganancia por Venta
```
Ganancia = (Precio Unitario - Precio Compra) × Cantidad
```

### Total Ingresos
```
Total = Precio Venta × Cantidad
```

---

## ⚠️ Notas Importantes

1. **No puedes editar el nombre de un producto una vez creado** (para mantener integridad de datos)
2. **El stock no puede ser negativo** - el sistema valida esto
3. **El precio de venta siempre debe ser ≥ precio de compra**
4. **Las ventas quedan registradas** - no se pueden eliminar para auditoría

---

## 🤝 Integración con otras funciones

- Las ventas se pueden exportar junto con las citas
- Los reportes se relacionan con nómina (ganancia por día)
- Compatible con la fidelización de clientes

---

## 📞 Soporte

Si algo no funciona:

1. Verifica que la BD se inicializó (ejecutar `init-productos.bat`)
2. Asegúrate de estar logueado como Admin o Supervisor
3. Revisa la consola del navegador (F12) para mensajes de error
4. Mira los logs del backend: `node --watch backend/index.js`

---

**Versión:** 1.0  
**Última actualización:** Enero 2026
