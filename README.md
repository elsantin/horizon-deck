# 🌌 Horizon: Profitability Radar

Horizon es un visualizador premium de oportunidades laborales diseñado para el perfil de **Santi**. Utiliza IA avanzada para analizar ofertas, priorizar rentabilidad y generar pitches operativos inmediatos.

## ✨ Filosofía "Wisdom Core"
Horizon no es solo una base de datos; es un motor de inteligencia que aplica la **Regla de Rentabilidad Proporcional** para asegurar que cada minuto invertido en una propuesta valga la pena.

### Características Principales
- 🧠 **Radar de Interés:** Visualización de alto impacto con scroll infinito y efecto "Fog Edge".
- ⚡ **Bypass Mode:** Importación manual de JSON para optimización de costos de API.
- 🔍 **Extracción Inteligente:** Identifica automáticamente `posted_at`, `job_link` y `company_link`.
- 📋 **CRM Operativo:** Marca ofertas como "Applied" y gestiónalas en el archivo histórico.
- 💾 **Data Management Segura:** Export/Import de Backups en JSON, y auto-snapshots de emergencia (Estrategia Replace Total).
- 🖱️ **Gestión Batch:** Selección múltiple (Ctrl+Click, Shift+Click) para eliminación en lote dinámica.
- 🎨 **Estética Premium:** Tema oscuro con acentos cinéticos y tipografía moderna.

## 🛠️ Stack Tecnológico
- **Frontend:** Next.js 15, Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend:** Convex (Real-time DB & Cloud Functions).
- **AI Engine:** Google Gemini (2.0 Flash/Pro) vía AI SDK.
- **Markdown:** React-Markdown para renderizado elegante de estrategias.

## 🚀 Inicio Rápido

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env.local` con:
   ```env
   CONVEX_DEPLOYMENT=...
   NEXT_PUBLIC_CONVEX_URL=...
   GOOGLE_GENERATIVE_AI_API_KEY=...
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## 📜 Protocolo de Análisis
Horizon utiliza un **System Prompt** inyectado dinámicamente que prioriza:
1. Rentabilidad Proporcional (Esfuerzo vs. Recompensa).
2. Tiers de Valor (Tier 1 a Tier 4).
3. Estrategia de Pitch "Punchy".

---
*Desarrollado con precisión para Horizon Deck.*
