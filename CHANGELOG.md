# Bitácora de Cambios (Changelog)

Todas las actualizaciones y nuevas funcionalidades de Horizon Deck se documentarán aquí.

## [2026-03-30] - Refinamientos de UX/UI en el Analyzer y Dashboard

- **Mejorado:** Animación `pulse-slow` en tarjetas no leídas reducida a **3.5s** (antes 6s) para hacerla perceptible visualmente.
- **Mejorado:** Grosor del anillo indicador de "No leída" aumentado de `ring-1` a `ring-2` para mayor visibilidad contra el fondo oscuro.
- **Añadido:** Parámetro `disablePulse` en la función `getCardBorder` para controlar selectivamente si la animación se aplica o no según el contexto de uso.
- **Corregido:** La tarjeta de resultado del Analyzer ya no hereda el pulse de `seen: false` — el indicador visual de no leído solo aparece en el Dashboard.
- **Eliminado:** El `resumen_ejecutivo` fue removido de la tarjeta del Analyzer (sección compacta) — sigue visible en el Dashboard y en el modal de detalles completo.
- **Mejorado:** Tarjeta de resultado del Analyzer rediseñada para ser totalmente compacta (~110px de alto): layout horizontal, score reducido de `text-5xl` a `text-3xl`, badges y botón en una única fila, eliminando `CardHeader` y `CardFooter` separados.
- **Corregido:** Lints de Markdown (MD022, MD031, MD032) en `README.md`, `CHANGELOG.md` y `ROADMAP.md` — todos resueltos con líneas en blanco mínimas requeridas.

## [2026-03-24] - Mejoras en Inteligencia y Gestión de Pipeline

- **Añadido:** Sistema de estados para las oportunidades de trabajo (Favorita, No leída, Aplicada) con interfaces reactivas y diferenciación visual.
- **Añadido:** Inclusión de "Mini-ficha" obligatoria en los análisis de la IA para asegurar la visibilidad de datos clave (Cargo, Empresa, Modalidad, Pago).

## [2026-03-24] - Gestión Batch y Backups Locales Seguros

- **Añadido:** Sistema de Backup y Restore en formato JSON (Data Management Segura).
- **Añadido:** Snapshots Automáticos de Emergencia en memoria local para proteger datos antes de restauraciones destructivas (Replace Total).
- **Añadido:** Nueva pestaña "Datos" en la Configuración para gestionar copias de seguridad.
- **Añadido:** Sistema de Selección Múltiple (Gestión Batch) en el Dashboard usando combinaciones de `Ctrl+Click` y `Shift+Click`.
- **Añadido:** Floating Bar Inferior dinámica para la eliminación múltiple de análisis.
- **Corregido:** Mitigada la alucinación de la Inteligencia Artificial al generar URLs (`company_link`) inventadas cuando la oferta no incluye información explícita.
