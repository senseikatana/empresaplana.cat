# ADR-0012: Un único gate de verificación, y `astro build` queda fuera a propósito

- **Estado:** current
- **Familia:** delivery
- **Decide:** engineering

## Decisión

`bun run verify` = Biome + `astro check` + tests unitarios + Playwright E2E + `release:check`. `deploy:insforge` lo ejecuta antes de desplegar. No hay CI.

## Alternativas descartadas

- Gate que también construya: descartado. El gate valida el código, no `dist/`. Excluir `astro build` evita fallos de compilación en entornos que no van a desplegar.
- Hooks pesados en los ganchos de git: descartados. `pre-commit` solo formatea con lint-staged y `pre-push` solo Biome; los dos se ejecutan en milisegundos.

## Consecuencias

- `generated/` está ignorado, así que un clon nuevo no tiene cliente Prisma: `bun run db:generate` antes de `astro check`, o aparecen ~44 errores que no existen.
- `release:check` falla cuando `package.json` no coincide con la última etiqueta; la herramienta de corte de versión vive fuera del repositorio y no se duplica.

## Riesgo que controla

drift:upstream-release-tooling

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
