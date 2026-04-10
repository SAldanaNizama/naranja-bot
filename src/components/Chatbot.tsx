import { useState, useRef, useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

// Backend API URL (cambiar a producción cuando se despliegue)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface ChatbotProps {
  mode?: "page" | "popup";
}

export function Chatbot({ mode = "page" }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "¡HOLA! Soy Finder+IA. Estoy aquí para ayudarte a encontrar los PROVEEDORES que necesites, CONTENIDOS Y PODCASTS sobre temas de los eventos que te interesan.\n\n¿En qué te puedo ayudar hoy?",
      isUser: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(`user-${Date.now()}`);
  const { toast } = useToast();
  const showAdvisorButton = messages.some(
    (message) =>
      !message.isUser &&
      message.content.toLowerCase().includes("consulta con nuestro equipo asesor"),
  );
  const showBudgetButton = messages.some(
    (message) => !message.isUser && /\b1\./.test(message.content),
  );
  const actionLabel = showAdvisorButton
    ? "Solicitar asesor"
    : showBudgetButton
    ? "Solicitar presupuesto"
    : undefined;
  const actionPayload = showAdvisorButton ? "ACTION: ADVISOR_START" : "ACTION: BUDGET_START";
  const resetChat = () => {
    sessionIdRef.current = `user-${Date.now()}`;
    setIsLoading(false);
    setMessages([
      {
        id: "welcome",
        content: "¡HOLA! Soy Finder+IA. Estoy aquí para ayudarte a encontrar los PROVEEDORES que necesites, CONTENIDOS Y PODCASTS sobre temas de los eventos que te interesan.\n\n¿En qué te puedo ayudar hoy?",
        isUser: false,
      },
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLinkClick = (url: string, label: string) => {
    fetch(`${API_URL}/api/link-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        url,
        linkLabel: label,
      }),
    }).catch(() => {});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string, displayContent = content) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: displayContent,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          chatInput: content,
        }),
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      // Check if response is streaming
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("text/event-stream") || contentType?.includes("text/plain")) {
        // Solo 3 puntitos mientras carga; la burbuja del bot se agrega cuando llega el primer contenido
        const botMessageId = (Date.now() + 1).toString();
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let messageAdded = false;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;

            if (accumulatedContent.trim().length > 0) {
              if (!messageAdded) {
                setMessages((prev) => [...prev, { id: botMessageId, content: accumulatedContent, isUser: false }]);
                setIsLoading(false);
                messageAdded = true;
              } else {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, content: accumulatedContent } : msg
                  )
                );
              }
            }
          }
        }
        if (!messageAdded) setIsLoading(false);
      } else {
        // Handle regular JSON response
        const data = await response.json();
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.output || data.message || data.response || "Lo siento, no pude procesar tu mensaje.",
          isUser: false,
        };

        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta de nuevo.",
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isPopup = mode === "popup";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-background",
        isPopup
          ? "w-[92vw] max-w-md h-[70vh] max-h-[80vh] rounded-2xl border border-border shadow-lg"
          : "h-[100dvh] min-h-[100dvh] max-h-[100dvh]"
      )}
    >
      <ChatHeader onNewChat={resetChat} compact={isPopup} />

      <div className={cn("flex-1 overflow-y-auto space-y-4", isPopup ? "p-3" : "p-4")}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isUser={message.isUser}
            onLinkClick={handleLinkClick}
          />
        ))}
        {isLoading && (
          <ChatMessage message="" isUser={false} isLoading />
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        {...({
          onSend: sendMessage,
          onActionStart: () => sendMessage(actionPayload, actionLabel || ""),
          actionLabel,
          disabled: isLoading,
        } as any)}
      />
    </div>
  );
}
