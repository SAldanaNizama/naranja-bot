# FinderAI Bot

Bot de asistencia virtual para eventolplux con backend Node.js + SQLite.

## Arquitectura

- **Frontend**: React + Vite + TypeScript + Tailwind
- **Backend**: Node.js + Express + SQLite
- **Integración**: n8n webhook para IA conversacional

## Instalación

### 1. Frontend

```bash
npm install
cp .env.example .env
```

Edita `.env` con la URL del backend:
```
VITE_API_URL=http://localhost:3001
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

El `.env` ya tiene configurado el webhook de n8n.

## Ejecución Local

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Se ejecuta en `http://localhost:3001`

### Terminal 2: Frontend
```bash
npm run dev
```

Se ejecuta en `http://localhost:8080`

## Funcionalidades

### Chat
- Envío de mensajes a n8n
- Respuestas streaming o JSON
- SessionId persistente por sesión
- Botón "Solicitar presupuesto" (aparece al detectar "1.")
- Limpieza de markdown/emojis en respuestas
- Enlaces convertidos a "ver ficha"

### Base de Datos
Todos los mensajes (usuario + bot) se guardan en `backend/chats.db` con:
- `session_id`: ID único por sesión
- `message`: contenido
- `is_user`: 1 si es usuario, 0 si es bot
- `timestamp`: fecha/hora
- `metadata`: JSON adicional (errores, etc)

### API Admin

- **GET** `/api/admin/sessions` - Lista todas las sesiones
- **GET** `/api/admin/sessions/:sessionId` - Mensajes de una sesión

Ejemplo:
```bash
curl http://localhost:3001/api/admin/sessions
```

## Despliegue

### Frontend (Render Static Site)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variable**: `VITE_API_URL` → URL del backend en producción

### Backend (Render Web Service o Railway)
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Environment Variables**:
  - `PORT`: 3001 (o lo que asigne Render)
  - `N8N_WEBHOOK_URL`: webhook de n8n

## Tecnologías

- **Frontend**: Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **Backend**: Node.js, Express, better-sqlite3, node-fetch
- **Database**: SQLite
- **IA**: n8n webhook
