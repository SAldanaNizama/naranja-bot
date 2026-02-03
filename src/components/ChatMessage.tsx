import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isLoading?: boolean;
}

// Normalize incoming text and convert URLs to clickable links.
function normalizeMessageText(message: string) {
  return message
    .replace(/[*_`~]/g, "") // strip common markdown markers
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
      "",
    ) // remove emoji/symbols
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderMessageWithLinks(message: string) {
  const cleanMessage = normalizeMessageText(message);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = cleanMessage.split(urlRegex);
  const newsletterUrl = "https://www.eventoplus.com/newsletter";
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex since we're reusing it
      urlRegex.lastIndex = 0;
      const normalizedUrl = part.replace(/\/+$/, "");
      const linkLabel =
        normalizedUrl === newsletterUrl ? "Aqui" : "ver ficha";
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 transition-colors break-all"
        >
          {linkLabel}
        </a>
      );
    }
    return part;
  });
}

export function ChatMessage({ message, isUser, isLoading }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground border border-border"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={cn(
          "max-w-[75%] px-4 py-3 shadow-soft",
          isUser ? "chat-bubble-user" : "chat-bubble-bot"
        )}
      >
        {isLoading ? (
          <div className="flex gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot" style={{ animationDelay: "200ms" }} />
            <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot" style={{ animationDelay: "400ms" }} />
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderMessageWithLinks(message)}
          </p>
        )}
      </div>
    </div>
  );
}
