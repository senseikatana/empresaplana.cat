# ADR-0001: Astro con render en servidor y adaptador Node standalone

- **Estado:** current
- **Familia:** architecture
- **Decide:** engineering

## Decisión

La app corre en Node con `output: "server" y `adapter: node({ mode: "standalone" })`.

## Alternativas descartadas

- GitHub Pages / hosting estático: descartado. Toda página declara `prerender = false` y el sistema de auth, el CRUD y las APIs necesitan ejecutar código en la petición.
- Workers: descartado. El compilador de consultas de Prisma necesita Node; no se ha generado un cliente compatible con workerd.
- SSG puro: descartado. Las páginas de dashboard leen datos en cada petición.

## Consecuencias

- Cualquier migración a hosting estático exige cambiar `output` y auditar cada página con `prerender = false`.
- El adaptador y el modo son la superficie mínima que Prisma puede ejecutar. Es una dependencia con la que hay que convivir.

## Riesgo que controla

drift:astro-major

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
