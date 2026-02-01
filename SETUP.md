# Guía de Instalación y Configuración

## 🚀 Inicio Rápido

### 1. Instalar Frontend

```bash
npm install
```

### 2. Instalar Backend

```bash
cd backend
npm install
cd ..
```

### 3. Configurar Variables de Entorno

**Frontend** (raíz del proyecto):
```bash
cp .env.example .env
```

Contenido de `.env`:
```
VITE_API_URL=http://localhost:3001
```

**Backend** (carpeta backend):
```bash
cd backend
cp .env.example .env
```

El `.env` ya viene configurado:
```
PORT=3001
N8N_WEBHOOK_URL=https://gexternia.app.n8n.cloud/webhook/949b6b9a-69a6-40b2-85e1-36e2ddb613f2/chat
```

### 4. Ejecutar en Desarrollo

Abre **2 terminales**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Verás:
```
🚀 Backend FinderAI corriendo en http://localhost:3001
📊 Admin API: http://localhost:3001/api/admin/sessions
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Verás:
```
VITE vX.X.X  ready in XXX ms

➜  Local:   http://localhost:8080/
```

### 5. Probar

1. Abre http://localhost:8080 en tu navegador
2. Escribe un mensaje y envíalo
3. El bot responderá a través de n8n
4. Los mensajes se guardan automáticamente en `backend/chats.db`

### 6. Ver Admin

Accede a http://localhost:8080/admin para ver:
- Lista de todas las sesiones
- Mensajes de cada sesión
- Timestamps y metadata

## 📦 Estructura del Proyecto

```
naranja-bot/
├── backend/
│   ├── server.js          # Servidor Express
│   ├── database.js        # Gestión SQLite
│   ├── package.json       # Dependencias backend
│   ├── .env               # Config backend
│   └── chats.db           # Base de datos (se crea automáticamente)
├── src/
│   ├── components/
│   │   ├── Chatbot.tsx    # Componente principal del chat
│   │   ├── ChatHeader.tsx # Header con logo
│   │   ├── ChatInput.tsx  # Input y botones
│   │   └── ChatMessage.tsx # Mensajes individuales
│   ├── pages/
│   │   ├── Index.tsx      # Página principal (chat)
│   │   └── Admin.tsx      # Panel admin
│   └── App.tsx            # Rutas
├── .env                   # Config frontend
└── package.json           # Dependencias frontend
```

## 🔧 Solución de Problemas

### Error: "Cannot connect to backend"

1. Verifica que el backend esté corriendo en la Terminal 1
2. Revisa que `.env` en la raíz tenga `VITE_API_URL=http://localhost:3001`
3. Reinicia ambos servidores (Ctrl+C y vuelve a correr)

### Error: "n8n webhook not responding"

1. Verifica que `backend/.env` tenga la URL correcta de n8n
2. Prueba el webhook directamente:
   ```bash
   curl -X POST https://gexternia.app.n8n.cloud/webhook/949b6b9a-69a6-40b2-85e1-36e2ddb613f2/chat \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "test-123", "chatInput": "hola"}'
   ```

### No veo datos en /admin

1. Primero usa el chat normal para generar mensajes
2. Verifica que `backend/chats.db` exista
3. Recarga la página de admin

## 🌐 Desplegar a Producción

### Backend en Render

1. Crea un nuevo **Web Service** en Render
2. Conecta tu repositorio
3. Configura:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `PORT`: (déjalo vacío, Render lo asigna)
     - `N8N_WEBHOOK_URL`: tu webhook de n8n
4. Deploy

Copia la URL del servicio (ej: `https://tu-backend.onrender.com`)

### Frontend en Render

1. Crea un nuevo **Static Site** en Render
2. Conecta el mismo repositorio
3. Configura:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: URL del backend (ej: `https://tu-backend.onrender.com`)
4. Deploy

## 📝 Notas

- SQLite guarda datos en `backend/chats.db` - haz backup periódicamente
- Para producción con mucho tráfico, considera migrar a PostgreSQL
- El panel admin NO tiene autenticación por defecto - añádela si lo publicas
