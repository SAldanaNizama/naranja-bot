interface ChatHeaderProps {
  onNewChat?: () => void;
}

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2 px-4 border-b border-border bg-card">
      <img
        src="/Finder.png"
        alt="FinderAI"
        className="h-32 w-auto object-contain"
      />
      {onNewChat && (
        <button
          type="button"
          onClick={onNewChat}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Nuevo chat
        </button>
      )}
    </div>
  );
}
