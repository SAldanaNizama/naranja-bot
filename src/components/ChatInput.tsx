import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatInputProps {
  onSend: (message: string) => void;
  onBudgetStart?: () => void;
  showBudgetButton?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onBudgetStart = () => {},
  showBudgetButton = false,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-t border-border bg-card">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu mensaje..."
        disabled={disabled}
        className={cn(
          "flex-1 px-4 py-3 rounded-xl border border-border bg-background",
          "text-sm placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      />
      {showBudgetButton && (
        <button
          type="button"
          onClick={onBudgetStart}
          disabled={disabled}
          className={cn(
            "px-4 py-3 rounded-xl border border-border bg-background",
            "flex items-center justify-center gap-2",
            "font-medium text-sm text-foreground",
            "hover:bg-muted active:scale-95",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
            "shadow-soft budget-attention"
          )}
        >
          Solicitar presupuesto
        </button>
      )}
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={cn(
          "px-4 py-3 rounded-xl bg-primary text-primary-foreground",
          "flex items-center justify-center gap-2",
          "font-medium text-sm",
          "hover:opacity-90 active:scale-95",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "shadow-soft"
        )}
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
