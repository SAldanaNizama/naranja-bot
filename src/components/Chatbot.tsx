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
      content: "Hola, soy Finder Plus, tu asistente de eventoplus. ¿En qué te podemos ayudar?",
      isUser: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(`user-${Date.now()}`);
  const { toast } = useToast();
  const showBudgetButton = messages.some(
    (message) => !message.isUser && /\b1\./.test(message.content),
  );
  const resetChat = () => {
    sessionIdRef.current = `user-${Date.now()}`;
    setIsLoading(false);
    setMessages([
      {
        id: "welcome",
        content: "Hola, soy Finder Plus, tu asistente de eventoplus. ¿En qué te podemos ayudar?",
        isUser: false,
      },
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        // Handle streaming response
        const botMessageId = (Date.now() + 1).toString();
        
        // Add empty bot message that will be updated
        setMessages((prev) => [...prev, { id: botMessageId, content: "", isUser: false }]);
        setIsLoading(false);
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;
            
            // Update the bot message with accumulated content
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
          }
        }
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
        "flex flex-col bg-background",
        isPopup
          ? "w-[92vw] max-w-md h-[70vh] max-h-[80vh] rounded-2xl border border-border shadow-lg"
          : "h-[100svh] max-h-[100svh]"
      )}
    >
      <ChatHeader onNewChat={resetChat} compact={isPopup} />

      <div className={cn("flex-1 overflow-y-auto space-y-4", isPopup ? "p-3" : "p-4")}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isUser={message.isUser}
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
          onBudgetStart: () => sendMessage("ACTION: BUDGET_START", "Solicitar presupuesto"),
          showBudgetButton,
          disabled: isLoading,
        } as any)}
      />
    </div>
  );
}
