interface ChatHeaderProps {
  onNewChat?: () => void;
  compact?: boolean;
}

export function ChatHeader({ onNewChat, compact = false }: ChatHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between border-b border-border bg-card ${
        compact ? "py-2 px-3" : "py-2 px-4"
      }`}
    >
      <img
        src="/Finder.png"
        alt="FinderAI"
        className={`w-auto object-contain ${compact ? "h-20" : "h-32"}`}
      />
      {onNewChat && (
        <button
          type="button"
          onClick={onNewChat}
          aria-label="Nuevo chat"
          title="Nuevo chat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-base hover:bg-accent hover:text-accent-foreground"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4.5 12a7.5 7.5 0 0 1 12.9-5.2"
              stroke="#f97316"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M17.4 6.8V3.6m0 3.2h-3.2"
              stroke="#f97316"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.5 12a7.5 7.5 0 0 1-12.9 5.2"
              stroke="#f97316"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M6.6 17.2v3.2m0-3.2h3.2"
              stroke="#f97316"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
