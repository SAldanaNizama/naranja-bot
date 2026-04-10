import { useEffect, useRef, useState } from "react";
import { Mic, Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface ChatInputProps {
  onSend: (message: string) => void;
  onActionStart?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onActionStart = () => {},
  actionLabel,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { toast } = useToast();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordMimeTypeRef = useRef<string | undefined>(undefined);
  const maxRecordTimeoutRef = useRef<number | null>(null);

  // Backend API URL (cambiar a producción cuando se despliegue)
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const MAX_RECORD_MS = 30_000;

  const cleanupMedia = () => {
    if (maxRecordTimeoutRef.current) {
      window.clearTimeout(maxRecordTimeoutRef.current);
      maxRecordTimeoutRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    recordMimeTypeRef.current = undefined;
    setIsRecording(false);
  };

  const transcribeAudio = async (blob: Blob, mimeType: string | undefined) => {
    const formData = new FormData();
    const ext = mimeType?.toLowerCase().includes("ogg") ? "ogg" : "webm";
    formData.append("audio", blob, `audio.${ext}`);

    setIsTranscribing(true);

    try {
      const response = await fetch(`${API_URL}/api/whisper`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(details || "Error transcribiendo con Whisper");
      }

      const data = (await response.json()) as { text?: string };
      const transcript = (data.text || "").trim();

      if (!transcript) {
        toast({
          title: "Sin texto",
          description: "No pude transcribir audio. Intenta de nuevo.",
          variant: "destructive",
        });
        return;
      }

      setMessage(transcript);
      // Mantener el flujo: transcripción -> usuario envía como texto normal
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al transcribir";
      toast({
        title: "Error de voz",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (disabled || isTranscribing || isRecording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = "Tu navegador no soporta grabación de audio.";
      toast({ title: "No soportado", description: msg, variant: "destructive" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      const mimeType = mimeCandidates.find((t) => MediaRecorder.isTypeSupported(t));
      recordMimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const chunks = chunksRef.current;
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        cleanupMedia();

        if (chunks.length === 0) {
          toast({
            title: "Sin audio",
            description: "No se capturó audio. Intenta hablar de nuevo.",
            variant: "destructive",
          });
          return;
        }

        await transcribeAudio(blob, mimeType);
      };

      // Push-to-talk: inicia grabación hasta segundo click o timeout
      recorder.start();
      setIsRecording(true);

      maxRecordTimeoutRef.current = window.setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
      }, MAX_RECORD_MS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No pude acceder al micrófono.";
      toast({ title: "Micrófono", description: msg, variant: "destructive" });
      cleanupMedia();
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    if (maxRecordTimeoutRef.current) {
      window.clearTimeout(maxRecordTimeoutRef.current);
      maxRecordTimeoutRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();

    // Los tracks se cierran en cleanupMedia() desde onstop
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  useEffect(() => {
    return () => {
      // Cleanup al desmontar el componente
      try {
        recorderRef.current?.stop();
      } catch {
        // Ignorar errores al detener el recorder en cleanup
      }
      cleanupMedia();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isTranscribing) {
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
    <form
      onSubmit={handleSubmit}
      className={cn(
        "box-border flex w-full min-w-0 max-w-full flex-col gap-2 overflow-x-hidden border-t border-border bg-card",
        "p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:gap-3 sm:p-4 sm:pb-4",
      )}
    >
      <input
        type="text"
        value={message}
        ref={inputRef}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu mensaje..."
        disabled={disabled || isTranscribing}
        className={cn(
          "min-w-0 w-full flex-1 rounded-xl border border-border bg-background px-3 py-2.5 sm:px-4 sm:py-3",
          "text-base sm:text-sm placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      />
      <div className="flex w-full min-w-0 max-w-full shrink-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-3">
        {actionLabel && (
          <button
            type="button"
            onClick={onActionStart}
            disabled={disabled}
            className={cn(
              "min-h-11 min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-background px-2 py-2 sm:px-4 sm:py-3",
              "flex items-center justify-center gap-2",
              "text-xs font-medium text-foreground sm:text-sm",
              "hover:bg-muted active:scale-95",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
              "shadow-soft budget-attention",
            )}
          >
            <span className="truncate">{actionLabel}</span>
          </button>
        )}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={(disabled || isTranscribing) && !isRecording}
          aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background",
            "hover:bg-muted active:scale-95",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
            "shadow-soft",
          )}
        >
          {isRecording ? <Square className="w-4 h-4 text-destructive" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          type="submit"
          disabled={!message.trim() || disabled || isTranscribing}
          aria-label="Enviar mensaje"
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground",
            "text-sm font-medium",
            "hover:opacity-90 active:scale-95",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
            "shadow-soft",
          )}
        >
          <Send className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
