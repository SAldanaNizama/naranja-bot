export function ChatHeader() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <img
          src="/Finder.png"
          alt="FinderAI"
          className="h-10 w-auto object-contain"
        />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">En línea</span>
        </div>
      </div>
    </div>
  );
}
