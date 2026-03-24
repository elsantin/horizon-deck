"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Copy,
  Check,
  Briefcase,
  Zap,
  Settings,
  LogOut,
  CircleUser,
  Trash2,
  Plus,
  LayoutDashboard,
  Target,
  Crosshair,
  Star,
  ExternalLink,
  Code,
  Pencil,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  FolderOpen,
  List,
  LayoutGrid,
  MessageSquare,
  Globe,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { exportBackup, parseBackupFile } from "@/lib/dataManager";
import type { BackupAnalysis, BackupVaultItem } from "@/lib/dataManager";
import type { HorizonSettings, ModelId } from "@/lib/settings";
import { AnalysisModal } from "@/components/AnalysisModal";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

// ----------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------

type HorizonAnalysis = {
  _id?: any;
  score: number;
  cargo: string;
  empresa: string;
  pago: string;
  esfuerzo: string;
  tier: string;
  resumen_ejecutivo: string;
  analisis_estrategico_markdown: string;
  propuesta_markdown: string;
  applied?: boolean;
  posted_at?: string;
  job_link?: string;
  company_link?: string;
};

type HistoryEntry = {
  id: string;
  timestamp: number;
  analysis: HorizonAnalysis;
};

// ----------------------------------------------------------------
// Utilidades de score
// ----------------------------------------------------------------

const getCardBorder = (score: number) =>
  score >= 9.0
    ? "border-emerald-500/30"
    : score >= 8.0
      ? "border-orange-500/30"
      : "border-zinc-700/40";

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

/**
 * Pre-procesa texto de análisis para que ReactMarkdown lo renderice con párrafos limpios.
 * Detecta emojis seguidos de negritas (ej: "✅ **Título:**") e inserta doble salto de línea.
 */
const formatAnalysisMarkdown = (text: string): string => {
  if (!text) return "";
  // Inserta doble salto de línea antes de emojis que inician una sección temática
  // Detecta: emoji(s) seguido de texto en negrita
  let formatted = text.replace(
    /([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{2702}-\u{27B0}✅🚩⚠️💰🏠🔥💡🎯📌⚡🟢🟡🔴❌✨🧠📝🎨💼🔧📊])\s*(\*\*)/gu,
    "\n\n$1 $2",
  );
  // También inserta salto antes de "---", "##", etc.
  formatted = formatted.replace(/([^\n])(#{1,3}\s)/g, "$1\n\n$2");
  return formatted.trim();
};

// ----------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------

export default function Home() {
  const [oferta, setOferta] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] =
    useState<HorizonAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [settings, setSettings] = useState<HorizonSettings>(DEFAULT_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Analyzer fields
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    "gemini-3-flash-preview",
  );
  const [jobLink, setJobLink] = useState("");
  const [companyLink, setCompanyLink] = useState("");
  const [deepAnalysis, setDeepAnalysis] = useState(false);

  // Estado del modal y edit mode
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal importación manual JSON
  const [isManualImportOpen, setIsManualImportOpen] = useState(false);
  const [manualJson, setManualJson] = useState("");
  const [manualJsonError, setManualJsonError] = useState("");

  // Modal confirmación de borrado
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HorizonAnalysis | null>(
    null,
  );

  // Botón Scroll to Top
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Ordenamiento y vista
  const [radarSort, setRadarSort] = useState<"score" | "date">("score");
  const [dashboardView, setDashboardView] = useState<"card" | "list">("card");
  const [archivoView, setArchivoView] = useState<"card" | "list">("card");
  const [archivoSort, setArchivoSort] = useState<"score" | "date">("date");
  const [settingsTab, setSettingsTab] = useState<
    "ia" | "perfil" | "pitch" | "vault" | "datos"
  >("ia");

  // Estado del sistema de backup/restore
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<import("@/lib/dataManager").BackupPayload | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex Data
  const vaultItems = useQuery(api.userConfig.getVault) || [];
  const addVaultItem = useMutation(api.userConfig.addVaultItem);
  const removeVaultItem = useMutation(api.userConfig.removeVaultItem);
  const dbAnalysis = useQuery(api.analysis.getAnalysis) || [];
  const saveAnalysis = useMutation(api.analysis.saveAnalysis);
  const upsertAnalysis = useMutation(api.analysis.upsertAnalysis);
  const removeAnalysis = useMutation(api.analysis.removeAnalysis);
  const toggleApplied = useMutation(api.analysis.toggleApplied);

  const [newVaultLabel, setNewVaultLabel] = useState("");
  const [newVaultValue, setNewVaultValue] = useState("");

  // Refs para los contenedores de scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const archiveScrollRef = useRef<HTMLDivElement>(null);

  const handleAddVaultItem = async () => {
    if (!newVaultLabel.trim() || !newVaultValue.trim()) return;
    await addVaultItem({
      label: newVaultLabel,
      value: newVaultValue,
      type: newVaultValue.startsWith("http") ? "link" : "text",
    });
    setNewVaultLabel("");
    setNewVaultValue("");
    toast.success("Elemento añadido al Vault");
  };

  const copyVaultItem = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copiado al portapapeles`);
  };

  // Cargar settings e historial del localStorage al iniciar
  useEffect(() => {
    setSettings(loadSettings());
    const saved = localStorage.getItem("horizon-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
    const savedOferta = localStorage.getItem("horizon-oferta");
    if (savedOferta) {
      setOferta(savedOferta);
    }
  }, []);

  // Guardar la oferta en localStorage a medida que cambia
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("horizon-oferta", oferta);
    }
  }, [oferta]);

  // ----------------------------------------------------------------
  // Handlers de Backup / Restore
  // ----------------------------------------------------------------

  const handleExportBackup = () => {
    const analysisPayload: BackupAnalysis[] = dbAnalysis
      .filter((a: any) => a.horizonId)
      .map((a: any) => ({
        horizonId: a.horizonId!,
        score: a.score,
        cargo: a.cargo,
        empresa: a.empresa,
        pago: a.pago,
        esfuerzo: a.esfuerzo,
        tier: a.tier,
        resumen_ejecutivo: a.resumen_ejecutivo,
        analisis_estrategico_markdown: a.analisis_estrategico_markdown,
        propuesta_markdown: a.propuesta_markdown,
        createdAt: a.createdAt,
        applied: a.applied,
        postedAt: a.postedAt,
        jobLink: a.jobLink,
        companyLink: a.companyLink,
      }));

    const vaultPayload: BackupVaultItem[] = vaultItems.map((v: any) => ({
      label: v.label,
      value: v.value,
      type: v.type,
      createdAt: v.createdAt,
    }));

    exportBackup(analysisPayload, vaultPayload, settings);
    toast.success(`Backup exportado — ${analysisPayload.length} análisis`);
  };

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Limpiar el input para que el mismo archivo se pueda reimportar
    e.target.value = "";
    try {
      const backup = await parseBackupFile(file);
      setPendingBackup(backup);
      setIsImportConfirmOpen(true);
    } catch (err: any) {
      toast.error(err.message ?? "Error al leer el archivo de backup");
    }
  };

  const handleImportConfirm = async () => {
    if (!pendingBackup) return;
    setIsImporting(true);
    try {
      let inserted = 0;
      let updated = 0;
      for (const item of pendingBackup.analysis) {
        if (!item.horizonId) continue; // Skips docs sin ID (serán insertados sin merge)
        const existing = dbAnalysis.find(
          (a: any) => a.horizonId === item.horizonId,
        );
        await upsertAnalysis({
          horizonId: item.horizonId,
          score: item.score,
          cargo: item.cargo,
          empresa: item.empresa,
          pago: item.pago,
          esfuerzo: item.esfuerzo,
          tier: item.tier,
          resumen_ejecutivo: item.resumen_ejecutivo,
          analisis_estrategico_markdown: item.analisis_estrategico_markdown,
          propuesta_markdown: item.propuesta_markdown,
          createdAt: item.createdAt,
          applied: item.applied,
          postedAt: item.postedAt,
          jobLink: item.jobLink,
          companyLink: item.companyLink,
        });
        if (existing) updated++;
        else inserted++;
      }
      toast.success(
        `Backup restaurado — ${inserted} nuevos, ${updated} actualizados`,
      );
    } catch (err: any) {
      toast.error("Error al importar: " + (err.message ?? ""));
    } finally {
      setIsImporting(false);
      setIsImportConfirmOpen(false);
      setPendingBackup(null);
    }
  };

  // ----------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleAnalyze = async () => {
    if (!oferta.trim()) return;
    setIsLoading(true);
    setCurrentAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oferta,
          settings,
          jobLink: jobLink.trim() || null,
          companyLink: companyLink.trim() || null,
          model: selectedModel,
          deepAnalysis: deepAnalysis,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Error ${res.status}`);
      }

      const data: HorizonAnalysis = await res.json();
      setCurrentAnalysis(data);

      // Persistir en Convex para que aparezca en el Dashboard
      await saveAnalysis({
        score: data.score,
        cargo: data.cargo,
        empresa: data.empresa,
        pago: data.pago || "No especificado",
        esfuerzo: (["Bajo", "Medio", "Alto"].includes(data.esfuerzo)
          ? data.esfuerzo
          : "Medio") as "Bajo" | "Medio" | "Alto",
        tier: (["Tier 1", "Tier 2", "Tier 3"].includes(data.tier)
          ? data.tier
          : "Tier 3") as "Tier 1" | "Tier 2" | "Tier 3",
        resumen_ejecutivo: data.resumen_ejecutivo || "",
        analisis_estrategico_markdown: data.analisis_estrategico_markdown || "",
        propuesta_markdown: data.propuesta_markdown || "",
        createdAt: Date.now(),
        postedAt: data.posted_at,
        jobLink: data.job_link,
        companyLink: data.company_link,
      });

      toast.success("Análisis guardado en el Dashboard");
      setOferta("");
      setJobLink("");
      setCompanyLink("");
    } catch (err) {
      console.error(err);
      alert("Error al analizar. Revisa tu API Key en el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const updateSetting = <K extends keyof HorizonSettings>(
    key: K,
    value: HorizonSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleManualImport = async () => {
    try {
      setManualJsonError("");
      const parsed = JSON.parse(manualJson);

      // Validación básica
      if (
        !parsed.empresa ||
        !parsed.cargo ||
        typeof parsed.score !== "number"
      ) {
        throw new Error(
          "JSON Inválido: Faltan campos requeridos (empresa, cargo, score).",
        );
      }

      await saveAnalysis({
        score: parsed.score,
        cargo: parsed.cargo,
        empresa: parsed.empresa,
        pago: parsed.pago || "No especificado",
        esfuerzo: ["Bajo", "Medio", "Alto"].includes(parsed.esfuerzo)
          ? parsed.esfuerzo
          : "Medio",
        tier: ["Tier 1", "Tier 2", "Tier 3"].includes(parsed.tier)
          ? parsed.tier
          : "Tier 3",
        resumen_ejecutivo: parsed.resumen_ejecutivo || "",
        analisis_estrategico_markdown:
          parsed.analisis_estrategico_markdown || "",
        propuesta_markdown: parsed.propuesta_markdown || "",
        createdAt: Date.now(),
        postedAt: parsed.posted_at,
        jobLink: parsed.job_link,
        companyLink: parsed.company_link,
      });

      toast.success("Análisis guardado en el Dashboard");
      setIsManualImportOpen(false);
      setManualJson("");
    } catch (err: any) {
      setManualJsonError(
        err.message || "Error al leer el JSON. Verifica el formato.",
      );
    }
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  // Métricas para el Dashboard
  const tierCounts = dbAnalysis.reduce(
    (acc: Record<string, number>, item: any) => {
      const t = item.tier || "Sin Clasificar";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    },
    {},
  );

  const chartData = Object.entries(tierCounts).map(([tier, count]) => ({
    name: tier,
    total: count,
  }));

  const totalAnalisis = dbAnalysis.length;
  const appliedCount = dbAnalysis.filter((item: any) => item.applied).length;

  const parseDate = (d?: string, ct?: number) => {
    if (!d) return ct || 0;
    const match = d.match(/(\d+)\s*(d|h|m|w)/i);
    if (match) {
      const now = Date.now();
      const val = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === "h") return now - val * 3600000;
      if (unit === "d") return now - val * 86400000;
      if (unit === "w") return now - val * 604800000;
    }
    const parsed = Date.parse(d);
    return isNaN(parsed) ? ct || 0 : parsed;
  };

  // Proceso de Radar y Looping (Triplicado para Infinite Drum)
  let radarItems = dbAnalysis
    .filter((item: any) => !item.applied)
    .sort((a: any, b: any) => {
      if (radarSort === "score") return b.score - a.score;
      return (
        parseDate(b.postedAt, b._creationTime) -
        parseDate(a.postedAt, a._creationTime)
      );
    });

  const archiveItems = [...dbAnalysis].sort((a: any, b: any) => {
    if (archivoSort === "score") return b.score - a.score;
    return (
      parseDate(b.postedAt, b._creationTime) -
      parseDate(a.postedAt, a._creationTime)
    );
  });
  const dashboardListItems = [...radarItems]; // vista lista del dashboard

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Fondo con gradiente Sunset */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[50vh] w-[50vw] rounded-full bg-orange-500/8 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-[40vh] w-[40vw] rounded-full bg-purple-600/8 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              Horizon
            </h1>
            <p className="text-xs text-zinc-600">
              Strategic Intelligence · Private Access
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <CircleUser className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-zinc-800 bg-zinc-950 text-zinc-200"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Bio Vault (Quick Copy)</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  {vaultItems.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-zinc-500">
                      No hay elementos guardados.
                    </div>
                  ) : (
                    vaultItems.map((item: any) => {
                      const isUrl = item.value.trim().startsWith("http");
                      return (
                        <DropdownMenuItem
                          key={item._id}
                          onClick={(e) => {
                            // Si es URL, lo abre en nueva pestaña al clickear todo el botón
                            if (isUrl) {
                              window.open(item.value, "_blank");
                            } else {
                              copyVaultItem(item.label, item.value);
                            }
                          }}
                          className="group flex cursor-pointer items-center justify-between focus:bg-zinc-800 focus:text-zinc-100"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isUrl ? (
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            )}
                            <span className="truncate max-w-[120px]">
                              {item.label}
                            </span>
                          </div>
                          <div
                            role="button"
                            title="Copiar contenido"
                            onClick={(e) => {
                              e.stopPropagation(); // Evita que el clic se propague al item principal
                              copyVaultItem(item.label, item.value);
                              // Cierra el dropdown manualmente si es necesario disparando click (DropdownMenuItem maneja el cierre, pero interceptamos)
                              const escEvent = new KeyboardEvent("keydown", {
                                key: "Escape",
                              });
                              document.dispatchEvent(escEvent);
                            }}
                            className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 opacity-0 transition-opacity hover:bg-zinc-700 group-hover:opacity-100"
                          >
                            <Copy className="h-3 w-3 text-zinc-300" />
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-300"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Salir del Sistema
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 flex flex-col min-h-0 px-4 py-6">
        <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0">
          {/* Tabs de navegación superior */}
          <TabsList className="mb-6 grid w-full grid-cols-4 bg-zinc-900/80 border border-zinc-800">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="analizador"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              <Zap className="mr-2 h-4 w-4" /> Analyzer
            </TabsTrigger>
            <TabsTrigger
              value="archivo"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              <FolderOpen className="mr-2 h-4 w-4" /> Archive
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              <Settings className="mr-2 h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* ========================= TAB: DASHBOARD ========================= */}
          <TabsContent
            value="dashboard"
            className="flex-1 flex flex-col min-h-0 data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <div className="grid gap-4 md:grid-cols-4 shrink-0">
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Total Analyzed
                  </CardTitle>
                  <Target className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-zinc-100">
                    {totalAnalisis}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Opportunities processed
                  </p>
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-orange-400">
                    Tier 1 Found
                  </CardTitle>
                  <Star className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-orange-400">
                    {tierCounts["Tier 1"] || 0}
                  </div>
                  <p className="text-xs text-orange-500/70">Top priority</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-emerald-400">
                    Applied
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-emerald-400">
                    {appliedCount}
                  </div>
                  <p className="text-xs text-emerald-500/70">
                    Applications sent
                  </p>
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Avg. Score
                  </CardTitle>
                  <Crosshair className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-zinc-100">
                    {totalAnalisis > 0
                      ? (
                          dbAnalysis.reduce(
                            (acc: number, cur: any) => acc + (cur.score || 0),
                            0,
                          ) / totalAnalisis
                        ).toFixed(1)
                      : "0.0"}
                  </div>
                  <p className="text-xs text-zinc-500">Overall average score</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {totalAnalisis > 0 && (
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-200">
                        Interest Radar
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Top opportunities · Sorted by{" "}
                        {radarSort === "score" ? "score" : "date"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRadarSort(radarSort === "score" ? "date" : "score")
                        }
                        className="text-zinc-500 hover:text-zinc-200"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                        {radarSort === "score" ? "By Recency" : "By Score"}
                      </Button>
                      <div className="h-4 w-px bg-zinc-700 mx-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDashboardView("card")}
                        className={`h-7 w-7 ${dashboardView === "card" ? "text-orange-400" : "text-zinc-500"}`}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDashboardView("list")}
                        className={`h-7 w-7 ${dashboardView === "list" ? "text-orange-400" : "text-zinc-500"}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {dashboardView === "card" ? (
                    /* Infinite Drum Container - Card View */
                    <div
                      className="relative flex-1 [perspective:1000px] overflow-hidden min-h-0"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                      }}
                    >
                      <div
                        ref={scrollRef}
                        className="h-full overflow-y-auto pr-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-6 pb-20 pt-10"
                      >
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {radarItems.map((item: any, idx: number) => {
                            const tierStyle = getTierStyle(item.tier);
                            const summaryPreview = (
                              item.resumen_ejecutivo || ""
                            ).slice(0, 160);
                            return (
                              <Card
                                key={`${item._id}-${idx}`}
                                onClick={() => {
                                  setCurrentAnalysis(item);
                                  setIsModalOpen(true);
                                }}
                                className={`flex flex-col h-full group relative cursor-pointer overflow-hidden border-zinc-800 bg-zinc-900/40 transition-all duration-500 hover:border-orange-500/50 hover:bg-zinc-900/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-950/20 ${getCardBorder(item.score)}
                                  [transform-style:preserve-3d] hover:[transform:translateZ(20px)_rotateX(2deg)]`}
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {item.postedAt && (
                                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                            {item.postedAt}
                                          </span>
                                        )}
                                        {item.jobLink && (
                                          <a
                                            href={item.jobLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-orange-400"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        )}
                                      </div>
                                      <CardTitle className="text-sm text-zinc-200 truncate">
                                        {item.cargo || "No Title"}
                                      </CardTitle>
                                      <CardDescription className="text-zinc-500 truncate">
                                        {item.empresa}
                                      </CardDescription>
                                    </div>
                                    <span
                                      className={`shrink-0 text-2xl font-black tabular-nums ${getTierStyle(item.tier).text}`}
                                    >
                                      {item.score?.toFixed(1)}
                                    </span>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0 flex flex-col flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-3">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${tierStyle.badge}`}
                                    >
                                      {item.tier}
                                    </Badge>
                                    {item.pago && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-zinc-800 text-zinc-400 text-xs"
                                      >
                                        💰 {item.pago}
                                      </Badge>
                                    )}
                                    {item.esfuerzo && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-zinc-800 text-zinc-400 text-xs"
                                      >
                                        ⚡ {item.esfuerzo}
                                      </Badge>
                                    )}
                                  </div>
                                  {summaryPreview && (
                                    <p className="mt-auto text-xs text-zinc-400 italic border-l-2 border-zinc-700 pl-3 line-clamp-2">
                                      &ldquo;{summaryPreview}
                                      {summaryPreview.length >= 160
                                        ? "..."
                                        : ""}
                                      &rdquo;
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* List View */
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {dashboardListItems.map((item: any) => {
                        const tierStyle = getTierStyle(item.tier);
                        return (
                          <div
                            key={item._id}
                            className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/60 transition-colors cursor-pointer"
                            onClick={() => {
                              setCurrentAnalysis(item);
                              setIsModalOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                              <div
                                className={`shrink-0 text-lg font-bold tabular-nums w-10 text-center ${getTierStyle(item.tier).text}`}
                              >
                                {item.score?.toFixed(1)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  {item.postedAt && (
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-tighter">
                                      {item.postedAt}
                                    </span>
                                  )}
                                  {item.jobLink && (
                                    <ExternalLink className="h-2.5 w-2.5 text-zinc-600" />
                                  )}
                                </div>
                                <div className="truncate text-sm font-medium text-zinc-200">
                                  {item.cargo}
                                </div>
                                <div className="truncate text-xs text-zinc-500">
                                  {item.empresa} ·{" "}
                                  <span
                                    className={`font-medium ${tierStyle.text}`}
                                  >
                                    {item.tier}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {item.applied && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                  ✓
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {totalAnalisis === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 rounded-full bg-zinc-900 p-4 ring-1 ring-zinc-800">
                    <Target className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-200">
                    No data yet
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 max-w-md">
                    Go to the <strong>Analyzer</strong> to start processing job
                    opportunities.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ========================= TAB: ARCHIVO ========================= */}
          <TabsContent
            value="archivo"
            className="flex-1 flex flex-col min-h-0 data-[state=active]:flex data-[state=inactive]:hidden space-y-4"
          >
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-zinc-200">
                  Records ({totalAnalisis})
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage all your analyzed opportunities
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setArchivoSort(archivoSort === "score" ? "date" : "score")
                  }
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                  {archivoSort === "score" ? "By Recency" : "By Score"}
                </Button>
                <div className="h-4 w-px bg-zinc-700 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setArchivoView("card")}
                  className={`h-7 w-7 ${archivoView === "card" ? "text-orange-400" : "text-zinc-500"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setArchivoView("list")}
                  className={`h-7 w-7 ${archivoView === "list" ? "text-orange-400" : "text-zinc-500"}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative">
              {totalAnalisis === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FolderOpen className="h-10 w-10 text-zinc-700 mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300">
                    No records yet
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    Analyze your first offer from the Analyzer tab
                  </p>
                </div>
              ) : archivoView === "card" ? (
                <div
                  className="relative flex-1 [perspective:1000px] overflow-hidden min-h-0"
                  style={{
                    maskImage:
                      "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                  }}
                >
                  <div
                    ref={archiveScrollRef}
                    className="h-full overflow-y-auto pr-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-6 pb-20 pt-10"
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      {archiveItems.map((item: any, idx: number) => {
                        const tierStyle = getTierStyle(item.tier);
                        return (
                          <Card
                            key={`${item._id}-${idx}`}
                            className={`group relative cursor-pointer overflow-hidden bg-zinc-900/40 transition-all duration-500 hover:border-orange-500/50 hover:bg-zinc-900/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-950/20 [transform-style:preserve-3d] hover:[transform:translateZ(20px)_rotateX(2deg)] ${tierStyle.badge.includes("emerald") ? "border-emerald-500/20" : tierStyle.badge.includes("amber") ? "border-amber-500/20" : "border-red-500/20"}`}
                          >
                            <CardHeader
                              className="pb-2"
                              onClick={() => {
                                setCurrentAnalysis(item);
                                setIsModalOpen(true);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {item.postedAt && (
                                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                        {item.postedAt}
                                      </span>
                                    )}
                                    {item.jobLink && (
                                      <a
                                        href={item.jobLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-orange-400"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                  <CardTitle className="text-sm text-zinc-200 truncate">
                                    {item.cargo || "No Title"}
                                  </CardTitle>
                                  <CardTitle className="text-zinc-500 text-xs font-normal truncate">
                                    {item.empresa}
                                  </CardTitle>
                                </div>
                                <span
                                  className={`shrink-0 text-2xl font-black tabular-nums ${getTierStyle(item.tier).text}`}
                                >
                                  {item.score?.toFixed(1)}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${tierStyle.badge}`}
                                >
                                  {item.tier}
                                </Badge>
                                {item.pago && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-zinc-800 text-zinc-400 text-xs"
                                  >
                                    💰 {item.pago}
                                  </Badge>
                                )}
                                {item.applied && (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                    ✓ Applied
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex justify-between">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleApplied({ id: item._id });
                                }}
                                className={`text-xs ${item.applied ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-500 hover:text-zinc-300"}`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                {item.applied ? "Applied" : "Mark applied"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete(item);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-xs text-red-500/60 hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {archiveItems.map((item: any) => {
                    const tierStyle = getTierStyle(item.tier);
                    return (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/60 transition-colors cursor-pointer"
                        onClick={() => {
                          setCurrentAnalysis(item);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div
                            className={`shrink-0 text-lg font-bold tabular-nums w-10 text-center ${getTierStyle(item.tier).text}`}
                          >
                            {item.score?.toFixed(1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              {item.postedAt && (
                                <span className="text-[9px] text-zinc-600 uppercase tracking-tighter">
                                  {item.postedAt}
                                </span>
                              )}
                              {item.jobLink && (
                                <ExternalLink className="h-2.5 w-2.5 text-zinc-600" />
                              )}
                            </div>
                            <div className="truncate text-sm font-medium text-zinc-200">
                              {item.cargo}
                            </div>
                            <div className="truncate text-xs text-zinc-500">
                              {item.empresa} ·{" "}
                              <span className={`font-medium ${tierStyle.text}`}>
                                {item.tier}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.applied && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                              ✓
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleApplied({ id: item._id });
                            }}
                            className={`h-7 w-7 ${item.applied ? "text-emerald-400" : "text-zinc-600"}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="h-7 w-7 text-red-500/50 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ========================= TAB: ANALIZADOR ========================= */}
          <TabsContent
            value="analizador"
            className="overflow-y-auto data-[state=inactive]:hidden space-y-6 pb-6"
          >
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-zinc-200">
                      Nueva Operación
                    </CardTitle>
                    <CardDescription className="text-zinc-500 flex items-center gap-2 mt-1">
                      Pega el job post o perfil de Contra. Modelo:
                      <select
                        value={selectedModel}
                        onChange={(e) =>
                          setSelectedModel(e.target.value as ModelId)
                        }
                        className="bg-transparent text-orange-400 text-sm border-none outline-none cursor-pointer font-medium focus:ring-0"
                      >
                        <option value="gemini-3-flash-preview">
                          Gemini 3 Flash Preview
                        </option>
                        <option value="gemini-3-pro-preview">
                          Gemini 3 Pro Preview
                        </option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setDeepAnalysis(!deepAnalysis)}
                        className={`ml-2 flex items-center gap-1.5 text-sm transition-colors ${
                          deepAnalysis
                            ? "text-orange-400"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <span>🧠</span>
                        <span>Deep Analysis</span>
                        <span
                          className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${
                            deepAnalysis
                              ? "bg-orange-500 text-white"
                              : "bg-zinc-800"
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full bg-white transition-transform ${
                              deepAnalysis ? "translate-x-3" : "translate-x-0"
                            }`}
                          />
                        </span>
                      </button>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsManualImportOpen(true)}
                    className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-orange-400 h-8"
                  >
                    <Zap className="h-3 w-3 mr-1" /> Bypass Mode
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste the job description here..."
                  className="min-h-[220px] resize-y border-zinc-800 bg-zinc-950/70 text-zinc-200 placeholder:text-zinc-600 focus:ring-orange-500/20"
                  value={oferta}
                  onChange={(e) => setOferta(e.target.value)}
                  disabled={isLoading}
                />

                <div className="flex flex-col gap-2 w-full mt-2">
                  <input
                    type="url"
                    placeholder="Job post URL (Contra, LinkedIn...)"
                    value={jobLink}
                    onChange={(e) => setJobLink(e.target.value)}
                    className="w-full bg-transparent border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
                  />
                  <input
                    type="url"
                    placeholder="Company / profile URL"
                    value={companyLink}
                    onChange={(e) => setCompanyLink(e.target.value)}
                    className="w-full bg-transparent border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading || !oferta.trim()}
                  className="w-full bg-orange-600 font-bold text-white hover:bg-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.2)]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Analyze with Horizon
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tarjeta de resultado reciente */}
            {currentAnalysis && (
              <Card
                className={`border bg-zinc-900/80 shadow-xl ${getCardBorder(currentAnalysis.score)} animate-in fade-in slide-in-from-bottom-2`}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-zinc-100">
                      {currentAnalysis.cargo}
                    </CardTitle>
                    <CardDescription className="text-base text-zinc-400">
                      {currentAnalysis.empresa}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-5xl font-black tabular-nums leading-none ${getTierStyle(currentAnalysis.tier).text}`}
                    >
                      {currentAnalysis.score.toFixed(1)}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                    >
                      {currentAnalysis.tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300"
                    >
                      💰 {currentAnalysis.pago}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300"
                    >
                      ⚡ {currentAnalysis.esfuerzo}
                    </Badge>
                  </div>
                  <p className="border-l-2 border-orange-500/40 pl-4 text-sm italic text-zinc-400 line-clamp-3">
                    &ldquo;{currentAnalysis.resumen_ejecutivo}&rdquo;
                  </p>
                </CardContent>
                <CardFooter className="border-t border-zinc-800 pt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(true)}
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Open Detailed Brief
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          {/* ========================= TAB: SETTINGS ========================= */}
          <TabsContent
            value="settings"
            className="flex-1 flex flex-col min-h-0 data-[state=active]:flex data-[state=inactive]:hidden"
          >
            {/* Mini-tabs de navegación */}
            <div className="flex items-center gap-1 border-b border-zinc-800 pb-0 shrink-0 mb-4 flex-wrap">
              {(["ia", "perfil", "pitch", "vault", "datos"] as const).map((tab) => {
                const labels = {
                  ia: "🤖 IA",
                  perfil: "👤 Perfil",
                  pitch: "✉️ Pitch",
                  vault: "🗄️ Vault",
                  datos: "💾 Datos",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2 -mb-px ${
                      settingsTab === tab
                        ? "text-orange-400 border-orange-400 bg-zinc-900/50"
                        : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/30"
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Contenido de cada pestaña */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* ── IA ── */}
              {settingsTab === "ia" && (
                <div className="space-y-6 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                      Modelo de IA
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Controla qué modelo usa Horizon para analizar ofertas.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5 sm:w-1/2">
                      <label className="text-xs text-zinc-500">
                        Modelo Preferido
                      </label>
                      <select
                        value={settings.preferredModel}
                        onChange={(e) =>
                          updateSetting(
                            "preferredModel",
                            e.target.value as HorizonSettings["preferredModel"],
                          )
                        }
                        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="gemini-3-flash-preview">
                          Gemini 3 Flash Preview (Recomendado)
                        </option>
                        <option value="gemini-3-pro-preview">
                          Gemini 3 Pro Preview
                        </option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500">
                        System Prompt
                      </label>
                      <p className="text-xs text-zinc-600">
                        El rol y las reglas de comportamiento del analista de
                        IA.
                      </p>
                      <AutoResizeTextarea
                        value={settings.systemPrompt}
                        onChange={(e) =>
                          updateSetting("systemPrompt", e.target.value)
                        }
                        className="min-h-[180px] border-zinc-800 bg-zinc-950 font-mono text-sm text-zinc-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── PERFIL ── */}
              {settingsTab === "perfil" && (
                <div className="space-y-6 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                      Identidad Profesional
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Tu contexto, restricciones y stack que el modelo considera
                      al analizar.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-500">
                        Contexto Personal (Bio)
                      </label>
                      <AutoResizeTextarea
                        value={settings.bio}
                        onChange={(e) => updateSetting("bio", e.target.value)}
                        className="min-h-[160px] border-zinc-800 bg-zinc-950 font-mono text-sm text-zinc-200"
                        maxHeight={400}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-500">
                        Stack Tecnológico Actual
                      </label>
                      <AutoResizeTextarea
                        value={settings.currentStack}
                        onChange={(e) =>
                          updateSetting("currentStack", e.target.value)
                        }
                        className="min-h-[80px] border-zinc-800 bg-zinc-950 text-sm text-zinc-200"
                        placeholder="Next.js, TailwindCSS, Vercel AI SDK..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-500">
                        URLs de Portfolio (una por línea)
                      </label>
                      <AutoResizeTextarea
                        value={settings.portfolioUrls}
                        onChange={(e) =>
                          updateSetting("portfolioUrls", e.target.value)
                        }
                        className="min-h-[80px] border-zinc-800 bg-zinc-950 font-mono text-sm text-zinc-200"
                        placeholder={
                          "https://kaiavisions.com\nhttps://sunsetlabs.dev"
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── PITCH ── */}
              {settingsTab === "pitch" && (
                <div className="space-y-6 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                      Pitch Master
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Controla el estilo y contenido de las propuestas
                      generadas.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-500">
                        Firma Maestra
                      </label>
                      <AutoResizeTextarea
                        value={settings.masterSignature}
                        onChange={(e) =>
                          updateSetting("masterSignature", e.target.value)
                        }
                        className="min-h-[80px] border-zinc-800 bg-zinc-950 font-mono text-sm text-zinc-200"
                        placeholder={"— Santiago\nFullstack AI Developer"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Detailed Voice Guidelines
                      </label>
                      <p className="text-xs text-zinc-500">
                        Instrucciones precisas para redactar el{" "}
                        <code className="rounded bg-zinc-800 px-1 text-orange-400">
                          propuesta_markdown
                        </code>
                        .
                      </p>
                      <AutoResizeTextarea
                        value={settings.voiceGuidelines}
                        onChange={(e) =>
                          updateSetting("voiceGuidelines", e.target.value)
                        }
                        className="min-h-[160px] border-orange-500/20 bg-zinc-950 font-mono text-sm text-zinc-200 focus:ring-orange-500"
                        placeholder={
                          "Escribe en inglés fluido y natural...\n- Personaliza mencionando un detalle específico de la empresa...\n- Máximo 3 párrafos...\n- Termina con un call-to-action claro."
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-500">
                        Ejemplos de Output (guía al modelo sobre estilo)
                      </label>
                      <AutoResizeTextarea
                        value={settings.outputExamples}
                        onChange={(e) =>
                          updateSetting("outputExamples", e.target.value)
                        }
                        className="min-h-[200px] border-zinc-800 bg-zinc-950 font-mono text-sm text-zinc-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── VAULT ── */}
              {settingsTab === "vault" && (
                <div className="space-y-6 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                      Dynamic Quick-Copy Vault
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Elementos que aparecerán en el menú de tu perfil para
                      copiarlos rápidamente.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {vaultItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {item.label}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {item.value}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeVaultItem({ id: item._id });
                            toast.info("Elemento eliminado");
                          }}
                          className="h-8 w-8 text-zinc-500 hover:bg-red-400/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-end gap-2 border-t border-zinc-800/50 pt-3">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs text-zinc-500">
                          Nueva Etiqueta
                        </label>
                        <input
                          value={newVaultLabel}
                          onChange={(e) => setNewVaultLabel(e.target.value)}
                          placeholder="Ej: LinkedIn"
                          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs text-zinc-500">
                          Valor / URL
                        </label>
                        <input
                          value={newVaultValue}
                          onChange={(e) => setNewVaultValue(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddVaultItem();
                          }}
                        />
                      </div>
                      <Button
                        onClick={handleAddVaultItem}
                        disabled={
                          !newVaultLabel.trim() || !newVaultValue.trim()
                        }
                        className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DATOS ── */}
              {settingsTab === "datos" && (
                <div className="space-y-6 pb-4">
                  {/* Input file oculto — activado vía ref */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileSelected}
                  />

                  {/* Sección Export */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                        Exportar Backup
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Descarga un archivo{" "}
                        <code className="rounded bg-zinc-800 px-1 text-orange-400">.json</code>{" "}
                        con todos tus análisis y configuración actual.
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-mono">{dbAnalysis.length} análisis</span>
                        <span>·</span>
                        <span className="font-mono">{vaultItems.length} vault items</span>
                      </div>
                      <Button
                        onClick={handleExportBackup}
                        disabled={dbAnalysis.length === 0}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 gap-2"
                      >
                        <FolderOpen className="h-4 w-4" />
                        Exportar Backup
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-zinc-800" />

                  {/* Sección Import */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                        Importar Backup
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Restaura tus datos desde un archivo de backup. Los análisis
                        existentes se actualizarán, los nuevos se agregarán.
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 gap-2"
                      >
                        <ArrowUp className="h-4 w-4 rotate-90" />
                        Importar Backup
                      </Button>
                      <p className="mt-2 text-center text-[10px] text-zinc-600">
                        Solo archivos .json generados por Horizon Deck
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón guardar fijo al fondo */}
            <div className="shrink-0 flex items-center justify-between border-t border-zinc-800 pt-3 mt-2">
              <p className="text-xs text-zinc-600">
                Los cambios se guardan en tu navegador (localStorage).
              </p>
              <Button
                onClick={handleSaveSettings}
                className={`${settingsSaved ? "bg-emerald-600 hover:bg-emerald-500" : "bg-orange-600 hover:bg-orange-500"} text-white shadow-lg transition-colors`}
              >
                {settingsSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    ¡Guardado!
                  </>
                ) : (
                  "Guardar Configuración"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ======= DIALOG GLOBAL — Accesible desde cualquier tab ======= */}
      {/* DIALOG CONFIRMACIÓN IMPORT BACKUP */}
      <Dialog open={isImportConfirmOpen} onOpenChange={(open) => {
        if (!isImporting) {
          setIsImportConfirmOpen(open);
          if (!open) setPendingBackup(null);
        }
      }}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-200">
          <DialogHeader>
            <DialogTitle>¿Restaurar backup?</DialogTitle>
            <DialogDescription className="text-zinc-500 mt-2">
              Los análisis existentes serán actualizados con los datos del archivo.
              Los análisis nuevos se agregarán. Esta acción no se puede deshacer fácilmente.
              {pendingBackup && (
                <span className="mt-2 block font-mono text-xs text-zinc-400">
                  {pendingBackup.analysis.length} análisis en el archivo ·{" "}
                  exportado el{" "}
                  {new Date(pendingBackup.exportedAt).toLocaleDateString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => { setIsImportConfirmOpen(false); setPendingBackup(null); }}
              disabled={isImporting}
              className="text-zinc-400"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={isImporting}
              className="bg-orange-600 hover:bg-orange-500 text-white"
            >
              {isImporting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Restaurando...</>
              ) : (
                "Restaurar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG MANUAL IMPORT */}
      <Dialog open={isManualImportOpen} onOpenChange={setIsManualImportOpen}>
        <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 text-zinc-200">
          <DialogHeader>
            <DialogTitle>Manual JSON Import</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Paste the extracted JSON to bypass the API analysis (Bypass Mode).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {manualJsonError && (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                {manualJsonError}
              </div>
            )}
            <Textarea
              value={manualJson}
              onChange={(e) => setManualJson(e.target.value)}
              placeholder='{ "empresa": "Ejemplo", "cargo": "Dev", "score": 9.5 ... }'
              className="min-h-[300px] bg-zinc-900 font-mono text-xs text-zinc-300 border-zinc-800 focus:ring-orange-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsManualImportOpen(false)}
              className="text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleManualImport}
              disabled={!manualJson.trim()}
              className="bg-orange-600 hover:bg-orange-500 text-white"
            >
              Save to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ANALYSIS MODAL COMPONENT */}
      <AnalysisModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        analysis={currentAnalysis}
        onToggleApplied={(id) => toggleApplied({ id: id as any })}
        onDeleteRequest={(item) => {
          setIsModalOpen(false);
          setItemToDelete(item);
          setIsDeleteDialogOpen(true);
        }}
      />

      {/* DIALOG CONFIRMAR ELIMINACIÓN */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-200">
          <DialogHeader>
            <DialogTitle>Delete Record?</DialogTitle>
            <DialogDescription className="text-zinc-500 mt-2">
              This action cannot be undone. The record for{" "}
              <span className="text-zinc-300 font-medium">
                {itemToDelete?.empresa}
              </span>{" "}
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (itemToDelete?._id) {
                  const idToDelete = itemToDelete._id;
                  // Limpiar UI inmediatamente para evitar doble click
                  setIsDeleteDialogOpen(false);
                  setIsModalOpen(false);
                  setItemToDelete(null);
                  
                  try {
                    await removeAnalysis({ id: idToDelete });
                    toast.success("Record deleted successfully");
                  } catch (e) {
                    toast.error("Error deleting record");
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scroll to Top */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 h-10 w-10 rounded-full bg-orange-600 p-0 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-500 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
