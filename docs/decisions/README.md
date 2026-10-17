# Familias de decisión

`manifest.json` es el registro. Un fichero, seis familias, cada una validable
**por separado**.

## Qué contiene cada familia

```jsonc
{
  "id": "tracking",
  "title": "Report persistence, escalation and the honesty of the claim",
  "owner": "engineering,product,legal",
  "state": "current",          // proposed | current
  "adr": ["0003", "0004", "0005", "0007"],
  "risks": ["drift:compute-ephemerality", "drift:resend-prod-block"],
  "controlledBy": ["0003", "0004", "0005"]   // qué ADR sostiene su eficacia
}
```

`state` es el estado del conjunto. `adr` es el inventario — nunca decide nada.
`controlledBy` es el que señala qué ADR sostiene la eficacia de la familia. Un
riesgo apunta a su ADR; un ADR apunta a su riesgo. Nada se apunta a sí mismo.

## Las seis familias

| id | Qué decide | Dueño | Estado | ADR | Controlada por |
| --- | --- | --- | --- | --- | --- |
| `architecture` | runtime, hosting, render | engineering | current | 0001, 0008 | 0001 |
| `data-authority` | dónde vive la verdad y hacia dónde fluye | engineering | current | 0002, 0011 | 0002, 0011 |
| `tracking` | persistencia de reportes, escalado, y honestidad de la reclamación | engineering, product, legal | current | 0003–0005, 0007 | 0003, 0004, 0005 |
| `auth` | identidad, roles, protección de APIs | engineering | current | 0006, 0009 | 0006, 0009 |
| `realtime` | posición del vehículo, ETA, canal con la compañía | engineering, product | **proposed** | 0010 | **ninguno** |
| `delivery` | gates, versiones, despliegue | engineering | current | 0012 | 0012 |

**`realtime` es la única familia sin ADR controlador.** Sus dos bloqueadores
físicos están en `../risks/README.md` como `open`. Ningún componente puede
afirmar tiempo real mientras esa familia no llegue a `current`.

## Reglas de transición

1. `proposed` → `current` con el ADR ejecutado.
2. `current` → `superseded` **solo** con un ADR de la **misma** familia que lo
   reemplace. Una familia no se apaga por olvido.
3. `current` → `proposed` se permite cuando cambia algo de fuera: se llama
   revisión sin decisión y es la respuesta limpia a un riesgo `open`.
4. `implementada` → `current` solo con referencia al commit o PR en el propio
   ADR.
5. Ningún estado pasa a ningún otro solo por estar en el código: el código
   llega **después** del registro, no antes.

## Validar una familia aislada

Para `data-authority` sin mirar `architecture`:

```bash
# ¿todos sus ADR existen?
for id in 0002 0011; do ls docs/adr/ADR-$id-*.md; done

# ¿sus riesgos tienen ADR controlador?
grep -l 'drift:sheets-template' docs/risks/README.md docs/adr/ADR-0002-*.md
```

El chequeo máquina completo de consistencia entre manifiesto, ADR y riesgos
está previsto en `src/scripts/verify-migrations.mjs` como ampliación: hoy ese
script valida la estructura de migraciones, que es lo que sostiene a las
familias `data-authority` y `tracking` en producción.

---

**Ver también:** `../adr/README.md` · `../program/README.md` ·
`../risks/README.md` · `../architecture/README.md`
