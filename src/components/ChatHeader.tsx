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
          aria-label="Nuevo chat"
          title="Nuevo chat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-base hover:bg-accent hover:text-accent-foreground"
        >
          🔄
        </button>
      )}
    </div>
  );
}
