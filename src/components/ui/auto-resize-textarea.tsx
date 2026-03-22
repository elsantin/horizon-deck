import * as React from "react";
import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
  maxHeight?: number; // Prop opcional para definir la altura máxima con scroll
}

/**
 * Textarea que ajusta su altura automáticamente al contenido.
 * - Modo Normal: Siempre crece, overflow oculto, sin scrollbar fantasma.
 * - Modo maxHeight: Crece hasta el límite, luego activa un scrollbar
 *   personalizado (usado típicamente en campos muy extensos como Bio).
 */
const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ className, value, maxHeight, onChange, style, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement>(null);

  // Permite usar ref externa o interna
  const resolvedRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? innerRef;

  const resize = React.useCallback(() => {
    const el = resolvedRef.current;
    if (!el) return;
    // Reset a "auto" para que el scrollHeight recalcule correctamente
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [resolvedRef]);

  // Ajustar al cargar / al cambiar el value externamente
  React.useEffect(() => {
    resize();
  }, [value, resize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    resize();
    onChange?.(e);
  };

  return (
    <textarea
      ref={resolvedRef}
      value={value}
      onChange={handleChange}
      style={{
        boxSizing: "border-box",
        overflowY: maxHeight ? "auto" : "hidden",
        ...(maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
        ...style,
      }}
      className={cn(
        // Base styles equivalentes al <Textarea> de shadcn/ui
        "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Auto-resize: sin resize manual, altura mínima garantizada
        "resize-none min-h-[80px]",
        // Clases de scrollbar SOLO si hay maxHeight
        maxHeight && [
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-zinc-600",
          "[&::-webkit-scrollbar-thumb]:min-h-[40px]",
          "[&::-webkit-scrollbar-thumb:hover]:bg-orange-500/60",
          "[&::-webkit-scrollbar-thumb]:cursor-pointer"
        ],
        className,
      )}
      {...props}
    />
  );
});

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };
