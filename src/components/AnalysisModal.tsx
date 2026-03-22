"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ExternalLink,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Calendar,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

/** Valida que una URL sea real (empieza con http:// o https://) */
function isValidUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export type AnalysisModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: any | null;
  onToggleApplied: (id: string) => void;
  onDeleteRequest: (item: any) => void;
};

const getTierStyle = (tier: string) => {
  if (tier?.includes("Tier 1"))
    return {
      badge: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
      text: "text-emerald-400",
    };
  if (tier?.includes("Tier 2"))
    return {
      badge: "border-amber-500/50 text-amber-400 bg-amber-500/10",
      text: "text-amber-400",
    };
  return {
    badge: "border-red-500/40 text-red-400 bg-red-500/10",
    text: "text-red-400",
  };
};

const getScoreColor = (score: number) => {
  if (score >= 9) return "text-emerald-400";
  if (score >= 7) return "text-amber-400";
  return "text-red-400";
};

export function AnalysisModal({
  open,
  onOpenChange,
  analysis,
  onToggleApplied,
  onDeleteRequest,
}: AnalysisModalProps) {
  const [pitchContent, setPitchContent] = useState("");
  const [copied, setCopied] = useState(false);

  // Sync state when opening modal with new analysis
  useEffect(() => {
    if (open && analysis) {
      const pitchLimpio = analysis.propuesta_markdown
        ? analysis.propuesta_markdown.replace(/\\n/g, '\n')
        : "";
      setPitchContent(pitchLimpio);
      setCopied(false);
    }
  }, [open, analysis]);

  if (!analysis) return null;

  const handleCopyPitch = async () => {
    try {
      await navigator.clipboard.writeText(pitchContent);
      setCopied(true);
      toast.success("Pitch copiado al portapapeles", {
        description: "Listo para enviar la propuesta.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Error al copiar");
    }
  };

  const tierStyle = getTierStyle(analysis.tier);
  const scoreColor = getScoreColor(analysis.score);

  // Calculate pitch length colors
  const pitchLength = pitchContent.length;
  const lengthColor =
    pitchLength > 1400
      ? "text-red-400"
      : pitchLength >= 1200
        ? "text-amber-400"
        : "text-zinc-500";

  // Initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] w-full h-[85vh] max-h-[85vh] border-zinc-800 bg-zinc-950 text-zinc-200 p-0 shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="p-6 shrink-0 border-b border-zinc-900/50 bg-zinc-950 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 items-center">

              <div className="min-w-0 flex-1">
                <DialogTitle className="text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
                  {isValidUrl(analysis.companyLink) ? (
                    <a
                      href={analysis.companyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>{analysis.empresa}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  ) : (
                    <span>{analysis.empresa}</span>
                  )}
                </DialogTitle>
                <div className="mt-1 space-y-2">
                  <p className="text-base font-medium text-zinc-400 leading-tight">
                    {isValidUrl(analysis.jobLink) ? (
                      <a
                        href={analysis.jobLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline cursor-pointer inline-flex items-center gap-1 text-sm text-muted-foreground"
                      >
                        <span>{analysis.cargo}</span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {analysis.cargo}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-black tracking-tight ${scoreColor}`}>
                      {analysis.score?.toFixed(1)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${tierStyle.badge}`}
                    >
                      {analysis.tier}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleApplied(analysis._id || "")}
                  className={`gap-1.5 text-xs ${analysis.applied ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {analysis.applied ? "Applied" : "Mark as Applied"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteRequest(analysis)}
                  className="h-8 w-8 text-red-500/60 hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* TABS */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-zinc-950/50">
          <Tabs
            defaultValue="analisis"
            className="flex-1 flex flex-col h-full w-full"
          >
            <div className="px-6 pt-3 shrink-0 border-b border-zinc-900 bg-zinc-950">
              <TabsList className="bg-transparent border-none p-0 h-auto gap-6 opacity-80">
                <TabsTrigger
                  value="analisis"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-400 rounded-none px-0 pb-2 text-zinc-400 uppercase tracking-widest text-xs font-bold"
                >
                  📊 Análisis
                </TabsTrigger>
                <TabsTrigger
                  value="pitch"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-400 rounded-none px-0 pb-2 text-zinc-400 uppercase tracking-widest text-xs font-bold"
                >
                  ✉️ Pitch
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CONTENEDOR RELATIVO PARA TABSCONTENT ABSOLUTOS */}
            <div className="flex-1 min-h-0 relative w-full overflow-hidden">
              {/* TAB 1: ANÁLISIS */}
              <TabsContent
                value="analisis"
                className="absolute inset-0 mt-0 m-0 focus-visible:outline-none focus-visible:ring-0 outline-none"
              >
                <div className="relative h-full w-full">
                  <div className="h-full overflow-y-auto p-4 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="space-y-6 pb-6">
                      {/* Metadata Row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {analysis.pago && (
                      <Badge
                        variant="secondary"
                        className="bg-zinc-800 text-zinc-300 px-3 py-1"
                      >
                        💰 {analysis.pago}
                      </Badge>
                    )}
                    {analysis.esfuerzo && (
                      <Badge
                        variant="secondary"
                        className="bg-zinc-800 text-zinc-300 px-3 py-1"
                      >
                        ⚡ Esfuerzo: {analysis.esfuerzo}
                      </Badge>
                    )}
                    {analysis.postedAt && (
                      <Badge
                        variant="outline"
                        className="border-zinc-800 text-zinc-400 px-3 py-1 gap-1.5"
                      >
                        <Calendar className="h-3 w-3" />
                        Post: {analysis.postedAt}
                      </Badge>
                    )}
                    {analysis._creationTime && (
                      <Badge
                        variant="outline"
                        className="border-zinc-800 text-zinc-500 px-3 py-1 gap-1.5"
                      >
                        <Building2 className="h-3 w-3" />
                        Analizado:{" "}
                        {format(
                          new Date(analysis._creationTime),
                          "MMM d, yyyy HH:mm",
                        )}
                      </Badge>
                    )}
                  </div>

                  {/* Resumen Ejecutivo */}
                  {analysis.resumen_ejecutivo && (
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-orange-500/80 mb-2">
                        Resumen
                      </h4>
                      <p className="text-sm text-zinc-300 leading-relaxed italic">
                        {analysis.resumen_ejecutivo}
                      </p>
                    </div>
                  )}

                  {/* Análisis Detallado (Markdown) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">
                      Análisis Detallado
                    </h4>
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-a:text-orange-400 hover:prose-a:text-orange-300 [&_p]:whitespace-pre-wrap">
                      <ReactMarkdown>
                        {analysis.analisis_estrategico_markdown
                          ? analysis.analisis_estrategico_markdown.replace(/\\n/g, '\n')
                          : "*No hay datos detallados*"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
              {/* Fog bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none" />
            </div>
          </TabsContent>

              {/* TAB 2: PITCH */}
              <TabsContent
                value="pitch"
                className="absolute inset-0 mt-0 m-0 bg-zinc-950 focus-visible:outline-none focus-visible:ring-0 outline-none border-none"
              >
                <div className="flex flex-col h-full w-full overflow-hidden p-4">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-1 rounded bg-zinc-900 ${lengthColor}`}
                      >
                        {pitchLength} / 1500 chars
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {analysis.jobLink && (
                        <a
                          href={analysis.jobLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            Abrir Oferta{" "}
                            <ExternalLink className="ml-1.5 h-3 w-3" />
                          </Button>
                        </a>
                      )}
                      <Button
                        onClick={handleCopyPitch}
                        size="sm"
                        className="h-8 bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20"
                      >
                        {copied ? (
                          <Check className="mr-2 h-3.5 w-3.5" />
                        ) : (
                          <Copy className="mr-2 h-3.5 w-3.5" />
                        )}
                        {copied ? "Copied" : "Copy Pitch"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 focus-within:border-orange-500/40 focus-within:bg-zinc-900/80 transition-all">
                    <Textarea
                      value={pitchContent}
                      onChange={(e) => setPitchContent(e.target.value)}
                      className="w-full h-full resize-none border-none shadow-none bg-transparent p-0 text-zinc-200 font-serif text-lg leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-600 outline-none"
                      placeholder="El pitch se generará aquí..."
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
