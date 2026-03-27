# PROMPT PARA CLAUDE CODE
# Copia todo el texto de abajo y pégalo en Claude Code

---

Necesito que construyas una agencia de marketing multi-agente para RescueChip. 
Antes de escribir una sola línea de código, lee estos dos archivos en orden:

1. Lee `marketing-agency/BUILD_INSTRUCTIONS.md` — contiene toda la arquitectura, 
   las reglas, los system prompts de cada agente y el orden de construcción.

2. Lee los 5 archivos en `marketing-agency/context/` — son el cerebro de la agencia 
   y no deben modificarse bajo ninguna circunstancia:
   - context/brand.md
   - context/audience.md
   - context/products.md
   - context/competition.md
   - context/performance.md

Una vez que hayas leído todo, construye el sistema completo siguiendo exactamente 
el orden de construcción definido en BUILD_INSTRUCTIONS.md.

Reglas importantes:
- El fundador no es programador — todo debe ser simple de instalar y ejecutar
- Mensajes de error y toda la interfaz en español
- Los archivos de context/ NO se tocan bajo ninguna circunstancia
- Después de construir el Content Creator, pruébalo antes de continuar con los demás
- Después de construir el workflow weekly_content, pruébalo antes de continuar
- El trabajo termina cuando `python orchestrator.py` funciona sin errores y 
  genera un calendario de contenido completo con la voz correcta de RescueChip

Cuando termines, dime exactamente qué comandos debo ejecutar para instalarlo y usarlo.
