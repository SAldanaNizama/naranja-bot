import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isLoading?: boolean;
}

// Function to parse message and convert URLs to clickable links
function parseMessageWithLinks(message: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = message.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex since we're reusing it
      urlRegex.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 transition-colors break-all"
        >
          {part}
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
            {parseMessageWithLinks(message)}
          </p>
        )}
      </div>
    </div>
  );
}
