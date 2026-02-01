# Backend FinderAI

Backend Node.js + Express + SQLite para gestionar chats y comunicación con n8n.

## Instalación

```bash
cd backend
npm install
```

## Configuración

1. Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita `.env` con tus credenciales (ya configurado por defecto).

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se ejecuta en `http://localhost:3001`

## Endpoints

### Chat
- **POST** `/api/chat` - Envía mensaje al bot
  ```json
  {
    "sessionId": "user-123456",
    "chatInput": "hola"
  }
  ```

### Admin
- **GET** `/api/admin/sessions` - Lista todas las sesiones
- **GET** `/api/admin/sessions/:sessionId` - Obtiene mensajes de una sesión específica

### Health
- **GET** `/health` - Verifica que el servidor esté funcionando

## Base de Datos

Se crea automáticamente `chats.db` (SQLite) con la tabla:

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_user INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT
);
```

## Despliegue

Para producción, puedes usar:
- Render
- Railway
- Heroku
- VPS con PM2

Recuerda cambiar `VITE_API_URL` en el frontend al dominio de producción.
