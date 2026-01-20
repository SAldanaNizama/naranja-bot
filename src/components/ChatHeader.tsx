import { MessageCircle } from "lucide-react";

export function ChatHeader() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-soft overflow-hidden">
          <img 
            src="/externia-logo.svg" 
            alt="Externia" 
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <MessageCircle className="w-6 h-6 text-primary-foreground hidden" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">Externia</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">En línea</span>
          </div>
        </div>
      </div>
    </div>
  );
}
