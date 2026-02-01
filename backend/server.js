import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { saveMessage, getMessagesBySession, getAllSessions } from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

app.use(cors());
app.use(express.json());

// Endpoint principal: recibe mensaje, guarda, envía a n8n, guarda respuesta
app.post('/api/chat', async (req, res) => {
  const { sessionId, chatInput } = req.body;

  if (!sessionId || !chatInput) {
    return res.status(400).json({ error: 'sessionId y chatInput son requeridos' });
  }

  try {
    // 1. Guardar mensaje del usuario
    await saveMessage(sessionId, chatInput, true);

    // 2. Enviar a n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        chatInput,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n respondió con status ${n8nResponse.status}`);
    }

    const contentType = n8nResponse.headers.get('content-type');

    // Manejar streaming
    if (contentType?.includes('text/event-stream') || contentType?.includes('text/plain')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let accumulatedContent = '';

      for await (const chunk of n8nResponse.body) {
        const text = chunk.toString();
        accumulatedContent += text;
        res.write(text);
      }

      // Guardar respuesta completa del bot
      await saveMessage(sessionId, accumulatedContent, false);
      res.end();
    } else {
      // Respuesta JSON normal
      const data = await n8nResponse.json();
      const botMessage = data.output || data.message || data.response || 'Sin respuesta';

      // Guardar respuesta del bot
      await saveMessage(sessionId, botMessage, false);

      res.json({ response: botMessage });
    }
  } catch (error) {
    console.error('Error en /api/chat:', error);
    
    // Guardar error en DB
    await saveMessage(sessionId, `Error: ${error.message}`, false, { error: true });
    
    res.status(500).json({ 
      error: 'Error al procesar el mensaje',
      details: error.message 
    });
  }
});

// Endpoint admin: obtener todos los chats por sesión
app.get('/api/admin/sessions', (req, res) => {
  try {
    getAllSessions()
      .then((sessions) => res.json(sessions))
      .catch((error) => {
        console.error('Error en /api/admin/sessions:', error);
        res.status(500).json({ error: 'Error al obtener sesiones' });
      });
  } catch (error) {
    console.error('Error en /api/admin/sessions:', error);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// Endpoint admin: obtener mensajes de una sesión específica
app.get('/api/admin/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    getMessagesBySession(sessionId)
      .then((messages) => res.json(messages))
      .catch((error) => {
        console.error('Error en /api/admin/sessions/:sessionId:', error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
      });
  } catch (error) {
    console.error('Error en /api/admin/sessions/:sessionId:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend FinderAI corriendo en http://localhost:${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin/sessions`);
});
