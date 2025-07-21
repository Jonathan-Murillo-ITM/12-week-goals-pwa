# 12 Week Goals - PWA 📱

Una **Progressive Web App (PWA)** que funciona como aplicación nativa en tu iPhone y se conecta a tu API backend para crear listas de tareas de 12 semanas en Microsoft To Do.

## 🎯 Características

- **🚀 PWA Instalable**: Se instala como app nativa en tu iPhone
- **📱 Diseño Mobile-First**: Optimizada para dispositivos móviles  
- **⚡ Funciona Offline**: Una vez cargada, funciona sin internet
- **🎨 Interfaz Moderna**: Diseño iOS-native con animaciones fluidas
- **📝 Formularios Dinámicos**: Agrega y elimina metas dinámicamente
- **🔗 Integración Completa**: Se conecta a tu API backend
- **📅 12 Tareas Semanales**: Cada meta permite definir 12 tareas
- **🔐 Autenticación Microsoft**: Flujo OAuth integrado

## 📱 ¿Qué es una PWA?

Una PWA se ve, se siente y funciona **exactamente igual** que una app nativa:
- ✅ Ícono en tu pantalla de inicio
- ✅ Se abre sin barras del navegador  
- ✅ Pantalla completa como cualquier app
- ✅ Funciona offline una vez instalada
- ✅ Notificaciones push (próximamente)

## 🚀 Instalación y Uso

### **Paso 1: Iniciar el servidor local**

```bash
# En tu computadora Windows:
node server.js
```

### **Paso 2: Configurar tu API**

1. Asegúrate de que tu API .NET esté ejecutándose en puerto 8000
2. En `app.js`, cambia la URL:

```javascript
const API_CONFIG = {
    baseURL: 'http://TU_IP:8000/api', // Ejemplo: http://192.168.1.100:8000/api
    // ...
};
```

### **Paso 3: Instalar en tu iPhone** 

1. **Abre Safari** en tu iPhone
2. **Ve a**: `http://TU_IP:3000` (reemplaza TU_IP por la IP de tu PC)
3. **Toca el botón "Compartir"** 📤 (en la parte inferior)
4. **Selecciona "Añadir a pantalla de inicio"**
5. **¡Ya tienes la app!** 🎉

### **Paso 4: Usar la aplicación**

1. Abre la app desde tu pantalla de inicio
2. Toca "Crear Nuevas Metas"
3. Completa el formulario con tus metas y tareas
4. Envía a Microsoft To Do
5. Se abrirá Safari para autenticación
6. ¡Listo! Tus metas estarán en Microsoft To Do

## 🔧 Estructura del Proyecto

```
12WeekGoalsPWA/
├── index.html          # Estructura HTML de la PWA
├── styles.css          # Estilos iOS-native
├── app.js             # Lógica de la aplicación
├── sw.js              # Service Worker (offline)
├── manifest.json      # Configuración PWA
├── server.js          # Servidor local de desarrollo
├── package.json       # Configuración Node.js
└── icons/             # Iconos de la aplicación
    └── icon.svg       # Icono principal
```

## 🌐 Integración con tu API

La PWA se conecta a los mismos endpoints que planeaste:

- **POST** `/api/goals/create` - Crear nuevas metas
- **GET** `/api/goals/callback?code=` - Procesar callback de Microsoft

### Flujo de la Aplicación

1. **Usuario completa formulario** → PWA envía datos a tu API
2. **Tu API genera URL de autorización** → PWA recibe URL
3. **PWA abre Safari** → Usuario se autentica con Microsoft  
4. **Usuario regresa con código** → PWA envía código a tu API
5. **Tu API procesa** → Crea las listas y tareas en Microsoft To Do

## 🛠️ Configuración de Desarrollo

### **Obtener tu IP local:**

**Windows:**
```powershell
ipconfig | findstr IPv4
```

**Ejemplo de salida:**
```
IPv4 Address: 192.168.1.100
```

### **Configurar el firewall:**

1. Ve a **Windows Defender Firewall**
2. Clic en **"Permitir una aplicación..."**
3. Agrega **Node.js** a las excepciones
4. Permite conexiones en **redes privadas**

### **Probar desde tu celular:**

1. Asegúrate de que tu iPhone y PC estén en la misma red WiFi
2. Desde tu iPhone, ve a: `http://192.168.1.100:3000` (tu IP)
3. Si no funciona, verifica el firewall

## 🔍 Solución de Problemas

### **❌ No puedo acceder desde el iPhone**
- Verifica que ambos dispositivos estén en la misma red WiFi
- Configura el firewall de Windows para permitir Node.js
- Prueba desactivar temporalmente el firewall

### **❌ Error de conexión con la API**
- Verifica que tu API .NET esté ejecutándose
- Actualiza la IP en `app.js`
- Verifica que el puerto 8000 esté abierto

### **❌ La app no se instala en iPhone**
- Usa **Safari** (no Chrome)
- Asegúrate de estar en `http://` (no `https://` para desarrollo local)
- Verifica que el `manifest.json` se esté sirviendo correctamente

## 💡 Ventajas vs App Nativa

| Característica | App Nativa iOS | PWA |
|---|---|---|
| Desarrollo desde Windows | ❌ | ✅ |
| Sin expiraciones de 7 días | ❌ | ✅ |
| Sin Apple Developer Account | ❌ | ✅ |
| Actualizaciones instantáneas | ❌ | ✅ |
| Funciona offline | ✅ | ✅ |
| Se ve como app nativa | ✅ | ✅ |
| Ícono en pantalla inicio | ✅ | ✅ |

## 🎉 ¡Listo para Usar!

Tu PWA está configurada y funciona **exactamente igual** que una app nativa. La diferencia es que:

- ✅ **La desarrollaste desde Windows**
- ✅ **No necesitas recompilar cada 7 días** 
- ✅ **No necesitas cuenta de Apple Developer**
- ✅ **Las actualizaciones son instantáneas**

¡Disfruta creando tus metas de 12 semanas! 🎯
