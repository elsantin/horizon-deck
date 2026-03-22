# 🔄 CONTEXT.md - Protocolo de Handoff (Transferencia de Contexto)

Este archivo sirve para mantener el estado (state) del repositorio entre múltiples sesiones de desarrollo o entre diferentes agentes de IA.

> **Instrucción para el LLM / Agente:**
> Siempre lee este archivo al iniciar una sesión sobre este proyecto para comprender dónde nos quedamos y qué debes atacar a continuación. Antes de terminar una sesión profunda de código, **actualiza** las secciones de abajo reflejando el progreso del día.

---

## 📅 Estado Actual (Última actualización: 20 de Marzo, 2026)

### 🚀 Logros Recientes

- **Mejoras UI y Experiencia de Usuario**:
  - Creación del componente `AutoResizeTextarea` para campos de configuración dinámicos (crece infinito o con `maxHeight` según necesidad) eliminando el scroll fantasma no deseado.
  - Implementación de `ReactMarkdown` con `@tailwindcss/typography` (`prose prose-invert`) en el `AnalysisModal` para renderizar el análisis adecuadamente respetando emojis y jerarquías (###).
  - El pitch generado usa un `Textarea` nativo pero con limpieza de saltos de línea asíncronos (`\n`), lo cual mantiene la edición y garantiza copias al portapapeles inmaculadas para Contra.
- **Refinamiento de Prompts ("El Orquestador IA")**:
  - `schema.ts`: Rediseño del constraint de `propuesta_markdown` (límite caracteres, reglas estrictas de tono) y modificación de `resumen_ejecutivo` y `analisis_estrategico` ("El verdadero rol").
  - `settings.ts`: Adición de la "Jerarquía de Competencias" (Prioridades 1, 2, 3), "Filtros Críticos" (Semáforo de advertencias por rol), y la estricta "Lógica Salarial" para estandarizar evaluaciones de Rate/Hora. Se arregló un bug de sintaxis en `DEFAULT_OUTPUT_EXAMPLES`.

### 📌 En Proceso / Tarea Activa (Work in Progress)

> ¿Qué estábamos haciendo cuando se cortó la última sesión?

- Finalizando el refinamiento visual y la confiabilidad del modal de análisis para que el texto de la IA sea útil y presentable directamente en pantalla.

### 🛑 Bloqueadores o Bugs Conocidos

- Ninguno. Solucionados los problemas de renderizado de saltos de línea dobles y el error de compilación de las REGLAS DE ESTILO en TS.

### 🎯 Próximos Pasos Ideales (Lo que deberías hacer hoy)

1. **Paridad Dashboard-Archive**: Aplicar el toggle de vista (grid/lista en Dashboard) y de orden (score/recency en Archive).
2. **Settings**: Agrupar la interfaz de configuración en un sistema de pestañas (Tabs) internas para evadir el `AutoResizeTextarea` scroll si se sobrecarga la pantalla de settings.
_Aviso para Orquestador: Cada vez que finalices tickets importantes, pide al Agente que "Paquetice el estado y actualice CONTEXT.md"._
