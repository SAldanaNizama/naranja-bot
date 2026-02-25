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

// Endpoint principal: SSE inmediato, keep-alive, pipe n8n stream o JSON
app.post('/api/chat', async (req, res) => {
  const { sessionId, chatInput } = req.body;

  if (!sessionId || !chatInput) {
    return res.status(400).json({ error: 'sessionId y chatInput son requeridos' });
  }

  // 1) Guardar mensaje usuario
  await saveMessage(sessionId, chatInput, true);

  // 2) Abrir stream YA para evitar timeouts (524)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  // Flush inmediato (no visible en UI, por el trim/normalizado del front)
  res.write(' \n');

  // Keep-alive cada 15s (evita que se corte por inactividad)
  const keepAlive = setInterval(() => {
    try {
      res.write(' \n');
    } catch {}
  }, 15000);

  let accumulatedContent = '';

  try {
    // 3) Llamar a n8n (misma URL y body que ya usabas)
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, chatInput }),
    });

    if (!n8nResponse.ok) {
      const msg = `Error: n8n respondió con status ${n8nResponse.status}`;
      accumulatedContent = msg;
      res.write(msg);
      await saveMessage(sessionId, msg, false, { error: true });
      return;
    }

    const contentType = n8nResponse.headers.get('content-type') || '';

    // 4A) Si n8n devuelve texto/stream => lo pipeamos al front
    if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
      for await (const chunk of n8nResponse.body) {
        const text = chunk.toString();
        accumulatedContent += text;
        res.write(text);
      }

      await saveMessage(sessionId, accumulatedContent, false);
      return;
    }

    // 4B) Si n8n devuelve JSON => extraer mensaje y enviarlo por stream
    const data = await n8nResponse.json().catch(() => ({}));
    const botMessage =
      data.output || data.message || data.response || data.answer || 'Sin respuesta';

    accumulatedContent = botMessage;
    res.write(botMessage);
    await saveMessage(sessionId, botMessage, false);
  } catch (error) {
    console.error('Error en /api/chat:', error);

    const msg = 'Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta de nuevo.';
    try {
      res.write(msg);
    } catch {}

    await saveMessage(sessionId, `Error: ${error.message}`, false, { error: true });
  } finally {
    clearInterval(keepAlive);
    try {
      res.end();
    } catch {}
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
