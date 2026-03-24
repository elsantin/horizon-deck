/**
 * dataManager.ts
 * Módulo cliente para exportar e importar backups de Horizon Deck (Replace Total).
 * NOTA: Solo se ejecuta en el navegador — NO importar desde el servidor.
 */

// ----------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------

export type BackupAnalysis = {
  score: number;
  cargo: string;
  empresa: string;
  pago: string;
  esfuerzo: "Bajo" | "Medio" | "Alto";
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  resumen_ejecutivo: string;
  analisis_estrategico_markdown: string;
  propuesta_markdown: string;
  createdAt: number;
  applied?: boolean;
  postedAt?: string;
  jobLink?: string;
  companyLink?: string;
};

export type BackupVaultItem = {
  label: string;
  value: string;
  type: "link" | "text";
  createdAt: number;
};

export type BackupSettings = Record<string, unknown>;

export type BackupPayload = {
  exportedAt: string;
  version: string;
  analysis: BackupAnalysis[];
  vault: BackupVaultItem[];
  settings: BackupSettings;
};

// ----------------------------------------------------------------
// Export
// ----------------------------------------------------------------

/**
 * Construye el JSON de backup y lo descarga automáticamente.
 */
export function exportBackup(
  analyses: BackupAnalysis[],
  vaultItems: BackupVaultItem[],
  settings: BackupSettings,
): void {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const payload: BackupPayload = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    analysis: analyses,
    vault: vaultItems,
    settings,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `horizon-backup-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------------------
// Import / Parse
// ----------------------------------------------------------------

/**
 * Lee un File seleccionado por el usuario, parsea el JSON
 * y valida que tenga la estructura mínima esperada.
 * Lanza un Error descriptivo si el archivo es inválido.
 */
export async function parseBackupFile(file: File): Promise<BackupPayload> {
  const text = await file.text();
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "El archivo no es un JSON válido. Verifica que no esté corrupto.",
    );
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("exportedAt" in data) ||
    !("analysis" in data) ||
    !Array.isArray((data as BackupPayload).analysis)
  ) {
    throw new Error(
      "Estructura de backup inválida. El archivo no tiene el formato esperado de Horizon Deck.",
    );
  }

  return data as BackupPayload;
}
