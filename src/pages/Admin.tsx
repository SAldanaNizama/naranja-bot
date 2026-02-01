import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Session {
  session_id: string;
  message_count: number;
  first_message: string;
  last_message: string;
}

interface Message {
  id: number;
  session_id: string;
  message: string;
  is_user: number;
  timestamp: string;
  metadata: string | null;
}

const Admin = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/sessions/${sessionId}`);
      const data = await response.json();
      setMessages(data);
      setSelectedSession(sessionId);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Panel Admin - Chats</h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Volver al Chat
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Sesiones */}
          <div className="lg:col-span-1 bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Sesiones ({sessions.length})
            </h2>
            
            {loading && !selectedSession && (
              <p className="text-muted-foreground">Cargando...</p>
            )}

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => loadMessages(session.session_id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedSession === session.session_id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-mono text-sm truncate">
                    {session.session_id}
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    {session.message_count} mensajes
                  </div>
                  <div className="text-xs mt-1 opacity-70">
                    {formatDate(session.last_message)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mensajes de la Sesión */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              {selectedSession ? `Mensajes: ${selectedSession}` : "Selecciona una sesión"}
            </h2>

            {loading && selectedSession && (
              <p className="text-muted-foreground">Cargando mensajes...</p>
            )}

            {!selectedSession && !loading && (
              <p className="text-muted-foreground">
                Selecciona una sesión de la lista para ver los mensajes
              </p>
            )}

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.is_user
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-secondary text-secondary-foreground mr-12"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold text-sm">
                      {msg.is_user ? "Usuario" : "Bot"}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatDate(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                  {msg.metadata && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100">
                        Metadata
                      </summary>
                      <pre className="text-xs mt-1 opacity-70 overflow-x-auto">
                        {JSON.stringify(JSON.parse(msg.metadata), null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
