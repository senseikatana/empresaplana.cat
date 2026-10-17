# ADR-0011: La integración con la compañía es por fichero .xlsx/.csv

- **Estado:** proposed
- **Familia:** data-authority
- **Decide:** engineering

## Decisión

El portal de empleados es Laravel sobre Apache en Windows Server con PHP 7.2. No va a haber API moderna. El intercambio que sí va a funcionar es que ellos exporten su hoja y nosotros la importemos.

## Alternativas descartadas

- Contratarles una integración con API: descartada. Exige su parte de cambios y capacidad técnica que su plataforma no muestra.
- Scraper automático de su portal: descartada. Acceso sin autorización y dependencia frágil.

## Consecuencias

- Ya existe el patrón exacto: `src/scripts/sync-sheets.mjs` hace lo mismo con Google Sheets. No se diseña algo nuevo.
- No se puede prometer todavía: el importador no existe. Ver `docs/decisions/manifest.json`, familia `realtime`.

## Riesgo que controla

drift:sheets-template

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
