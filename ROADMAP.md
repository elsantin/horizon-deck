# Hoja de Ruta y Mejoras Futuras

Este documento hace seguimiento de la **Deuda Técnica** y **Futuras Implementaciones** del proyecto Horizon Deck.

## Deuda Técnica

Sin marcadores `TODO:`, `FIXME:` o `FUTURE:` en el código fuente a la fecha de la última auditoría (2026-03-31).

**Observaciones de arquitectura (sin bloqueo):**

- `page.tsx` supera las 2.200 líneas y concentra toda la lógica de UI, estado y renderizado. Candidato futuro para refactorización en componentes hijos.
- La función `getCardBorder` tiene ahora dos modos (`disablePulse`). Si el número de variantes crece, considerar mover a un archivo de utilidades separado (`src/lib/cardUtils.ts`).
- El componente `AnalysisModal` fue extraído correctamente. El bloque de tarjeta en el Analyzer podría seguir el mismo patrón en el futuro.

## Futuras Implementaciones

*Añadir próximos hitos y features planeadas por el Product Manager aquí.*
