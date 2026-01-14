# 🎁 Actualizar Sistema de Fidelización en VPS

## Cambios Nuevos

1. ✅ Tablas de base de datos: `clientes` y `cupones`
2. ✅ Sistema automático de cupones cada 10 lavadas
3. ✅ Contador que se reinicia después de otorgar cupón
4. ✅ Nueva sección "Clientes" en el panel admin
5. ✅ Servicio de envío de emails (nodemailer)
6. ✅ Historial total de lavadas por cliente

## 🚀 Pasos para Actualizar

### Opción 1: Script Automático (Recomendado)

```bash
# 1. Conectarse al VPS
ssh usuario@tu-servidor

# 2. Ir al directorio del proyecto
cd /var/www/motobombon

# 3. Ejecutar script de actualización
chmod +x update-fidelizacion.sh
./update-fidelizacion.sh
```

### Opción 2: Manual

```bash
# 1. Conectarse al VPS
ssh usuario@tu-servidor

# 2. Ir al directorio
cd /var/www/motobombon

# 3. Backup de base de datos
cp backend/database/database.sqlite backend/database/database.sqlite.backup

# 4. Actualizar código
git pull origin main

# 5. Instalar nuevas dependencias
cd backend
npm install nodemailer dotenv --save

# 6. Ejecutar migraciones
node database/initClientes.js
node database/addTotalLavadas.js

# 7. Configurar .env (ver abajo)
nano .env

# 8. Build frontend
cd ../Frontend
npm install
npm run build

# 9. Reiniciar servicios
cd ..
pm2 restart motobombon-backend
sudo systemctl reload nginx
```

## ⚙️ Configuración de Email (IMPORTANTE)

### 1. Editar .env en el backend

```bash
cd /var/www/motobombon/backend
nano .env
```

### 2. Agregar configuración SMTP

Para **Gmail**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

### 3. Generar Contraseña de Aplicación (Gmail)

1. Ve a: https://myaccount.google.com/apppasswords
2. Crea una nueva "Contraseña de aplicación"
3. Usa esa contraseña (16 caracteres) en `SMTP_PASS`
4. ⚠️ **NO uses tu contraseña normal de Gmail**

### 4. Para Otros Proveedores

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### 5. Reiniciar después de configurar

```bash
pm2 restart motobombon-backend
pm2 logs motobombon-backend --lines 50
```

## ✅ Verificación

### 1. Verificar que el backend inició correctamente
```bash
pm2 status
pm2 logs motobombon-backend
```

Debes ver:
```
🚀 Servidor corriendo en http://localhost:3000
```

### 2. Verificar base de datos
```bash
cd /var/www/motobombon/backend
sqlite3 database/database.sqlite "SELECT name FROM sqlite_master WHERE type='table';"
```

Debes ver las tablas: `clientes` y `cupones`

### 3. Verificar frontend
```bash
ls -la /var/www/motobombon/Frontend/dist/
```

Debe tener archivos recién compilados

### 4. Probar en el navegador
- Accede al panel admin
- Verifica que aparezca la sección "🎁 Clientes"
- Marca una cita como completada (con email de cliente)
- Verifica en los logs que se registre la lavada

## 🔍 Troubleshooting

### El email no se envía
```bash
# Ver logs
pm2 logs motobombon-backend | grep -i email

# Verificar .env
cat /var/www/motobombon/backend/.env | grep SMTP

# Verificar que nodemailer esté instalado
cd /var/www/motobombon/backend
npm list nodemailer
```

### La tabla clientes no existe
```bash
cd /var/www/motobombon/backend
node database/initClientes.js
pm2 restart motobombon-backend
```

### Frontend no se actualiza
```bash
# Limpiar cache de Nginx
sudo systemctl restart nginx

# Forzar rebuild
cd /var/www/motobombon/Frontend
rm -rf dist node_modules
npm install
npm run build
```

### Permisos de base de datos
```bash
cd /var/www/motobombon/backend
sudo chown -R www-data:www-data database/
sudo chmod 664 database/database.sqlite
```

## 📊 Comandos Útiles

```bash
# Ver logs en tiempo real
pm2 logs motobombon-backend --lines 100

# Ver estado de PM2
pm2 status

# Reiniciar todo
pm2 restart all

# Ver uso de recursos
pm2 monit

# Guardar configuración PM2
pm2 save

# Ver log de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🎯 Testing del Sistema

### 1. Crear cita de prueba
- Email: test@ejemplo.com
- Nombre: Cliente Prueba
- Marcar como "completada"

### 2. Verificar en logs
```bash
pm2 logs motobombon-backend | grep "Cliente test@ejemplo.com"
```

### 3. Ver en panel de Clientes
- Admin → 🎁 Clientes
- Buscar "Cliente Prueba"
- Ver progreso 1/10

### 4. Simular 10 lavadas
Marcar 10 citas diferentes como completadas con el mismo email

### 5. Verificar email
- Revisar inbox de test@ejemplo.com
- Debe llegar email con cupón

## 🔐 Seguridad

- ✅ .env debe estar en .gitignore
- ✅ NUNCA subir credenciales SMTP a GitHub
- ✅ Usar contraseña de aplicación, no contraseña real
- ✅ Configurar firewall del VPS (puertos 22, 80, 443)

## 📞 Soporte

Si algo falla:
1. Ver logs: `pm2 logs motobombon-backend`
2. Verificar .env configurado correctamente
3. Verificar que las tablas existen en la BD
4. Revisar permisos de archivos

---

**¡Sistema de Fidelización Listo!** 🎉
