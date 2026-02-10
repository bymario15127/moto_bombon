# 🛍️ GUÍA SIMPLE - Vender Bebidas en tu App

Hola! Hemos creado un sistema para que controles las bebidas que vendes en el motolavado.

---

## ¿Qué puedo hacer?

### 1️⃣ Registrar bebidas
Agrega las bebidas que vendes (Coca, Cerveza, Agua, etc.) con:
- Nombre de la bebida
- Lo que te cuesta comprarla
- Lo que la vendes
- Cuántas tienes en stock

### 2️⃣ Registrar cada venta
Cuando alguien compra una bebida, lo anotas en la app:
- Qué bebida compró
- Cuántas compró
- **La app calcula automáticamente:**
  - Tu ganancia en esa venta
  - Actualiza el stock (cuántas te quedan)
  - Registra la hora y quién vendió

### 3️⃣ Ver ganancias
Al final del día ves:
- Cuánto vendiste en total
- Cuánto ganaste
- Cuántas bebidas vendiste
- Cuántas te quedan

---

## 👉 Cómo empezar? (Solo 1 vez)

### En Windows:
1. **En la carpeta del proyecto**, busca `init-productos.bat`
2. **Haz doble click** en ese archivo
3. **Espera a que termine** y cierra
4. ¡Listo!

### En Mac/Linux:
1. Abre Terminal
2. Ve a la carpeta del proyecto
3. Escribe: `bash init-productos.sh`
4. ¡Listo!

---

## 💡 Ejemplo paso a paso

### Primer día: Registro de bebidas

Supongamos que compré:
- 10 Coca Colas a $2,000 cada una
- 5 Cervezas a $5,000 cada una

**En la app:**
1. Abre tu dashboard (http://localhost:5173)
2. Ingresa como Administrador
3. Click en menú: **"📦 Productos"**
4. Haz click en **"➕ Nuevo Producto"**

**Bebida 1:**
```
Nombre: Coca Cola 350ml
Precio Compra: 2000
Precio Venta: 5000
Stock: 10
→ Click "Crear"
```

**Bebida 2:**
```
Nombre: Cerveza Corona
Precio Compra: 5000
Precio Venta: 12000
Stock: 5
→ Click "Crear"
```

**Eso es todo!** Ya tienes registradas tus bebidas.

---

### Segundo día: Vendiendo bebidas

**Llega un cliente y compra:**
- 2 Coca Colas
- 1 Cerveza

**En la app:**
1. Click en tab **"💰 Registrar Venta"**
2. Selecciona **"Coca Cola 350ml"** del dropdown
3. Escribe cantidad: **2**
4. Click **"Registrar Venta"**
5. Selecciona **"Cerveza Corona"**
6. Escribe cantidad: **1**
7. Click **"Registrar Venta"**

**¡Automáticamente la app hace:**
- ✅ Tu Coca Cola: de 10 → 8 unidades
- ✅ Tu Cerveza: de 5 → 4 unidades
- ✅ Calcula tu ganancia:
  - Coca Cola: 2 × ($5,000 - $2,000) = $6,000
  - Cerveza: 1 × ($12,000 - $5,000) = $7,000
  - **TOTAL GANANCIA: $13,000**

---

### Tercer día: Ver ganancias

**Al final del día:**
1. Click en tab **"💰 Registrar Venta"**
2. Ves un resumen:
   ```
   Total Ventas: $23,000
   Ganancia Neta: $13,000
   Cantidad de ventas: 3
   ```

---

## 📱 Los 3 botones principales

| Botón | Qué hace |
|-------|----------|
| **📦 Productos** | Crear/editar/eliminar bebidas |
| **💰 Registrar Venta** | Anotar cuando alguien compra |
| **📊 Reportes** | Ver ganancias por día |

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si se equivoca de bebida?**
R: Simplemente crea un nuevo registro con la cantidad correcta. No te preocupes, la BD lo guardará todo.

**P: ¿Se va a la basura si reinicio la app?**
R: ¡No! Todo se guarda en la base de datos del servidor.

**P: ¿Solo yo puedo ver esto?**
R: Tú (Admin) y tu Supervisora. Los clientes no lo ven.

**P: ¿Qué pasa si tengo 0 stock de algo?**
R: La app te avisa: "Stock insuficiente"

**P: ¿Puedo cambiar precios?**
R: Sí. Abre el producto y edítalo.

**P: ¿Cómo veo cuánto gané en una semana?**
R: Usa el tab **"📊 Reportes"** (próximamente mejorado).

---

## 🎯 Casos que puedes hacer

✅ Agregar bebidas nuevas  
✅ Cambiar precios de compra/venta  
✅ Actualizar stock  
✅ Registrar ventas  
✅ Ver ganancias del día  
✅ Editar bebidas existentes  
✅ Eliminar bebidas  

---

## ⚠️ Cosas a recordar

1. **Precio de venta debe ser MAYOR que precio de compra**
   - Ejemplo: Costo $2,000 → Vendo $5,000 ✅
   - Ejemplo: Costo $2,000 → Vendo $1,500 ❌

2. **El stock no puede ser negativo**
   - Si dices 2 vendidas pero solo tenía 1, la app te avisa

3. **Los nombres de bebidas no se pueden repetir**
   - Una sola "Coca Cola 350ml" en el sistema

4. **Todo queda registrado**
   - Quién vendió, cuándo, qué cantidad
   - Para auditoría y control

---

## 🚀 ¡Empecemos!

1. Ejecuta `init-productos.bat` (o `init-productos.sh`)
2. Abre la app
3. Ingresa como Admin
4. Ve al menú: **"📦 Productos"**
5. Crea tus bebidas
6. ¡Comienza a vender!

---

## 📞 Necesitas ayuda?

Si algo no funciona:
1. Abre la consola del navegador (F12)
2. Busca mensajes de error rojo
3. O mira el archivo `PRODUCTOS-VENTAS-MANUAL.md` para más detalles

---

**¡Listo para empezar a controlar tus bebidas! 🎉**

Próximamente agregaremos:
- 📈 Gráficos de ventas
- 📥 Exportar a Excel
- 📊 Reportes por semana/mes
- 🔔 Alertas de stock bajo
