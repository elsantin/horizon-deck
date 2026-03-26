# Bitácora de Cambios (Changelog)

Todas las actualizaciones y nuevas funcionalidades de Horizon Deck se documentarán aquí.

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
