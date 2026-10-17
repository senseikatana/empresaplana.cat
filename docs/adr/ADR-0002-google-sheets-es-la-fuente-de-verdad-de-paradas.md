# ADR-0002: Google Sheets es la fuente de verdad de paradas; Postgres es el modelo de lectura

- **Estado:** current
- **Familia:** data-authority
- **Decide:** engineering

## Decisión

Las paradas de las líneas de búsqueda se editan en una hoja de cálculo. `sync:sheets` sustituye `Line`, `SchedulesOnLine` y `LineConnection` en Postgres de forma idempotente.

## Alternativas descartadas

- Editar Postgres directamente y exportar a la hoja: descartado. El personal de línea ya trabaja en la hoja y la migración de hábitos no se justifica.
- Doble escritura sin dirección: descartado. Dos fuentes sincronizadas en ambos sentidos convergen en bucle.

## Consecuencias

- La hoja gana siempre: cualquier edición hecha en Postgres se pierde en el siguiente sync. Es intencional y documentado.
- `lat`/`lon` no se transportan por la hoja, así que las paradas del modelo público siguen sin coordenadas. Ver ADR-0010.
- El plantilla de la hoja es propiedad de terceros: si cambia, cambia el esquema de entrada. Ver `drift:sheets-template`.

## Riesgo que controla

drift:sheets-template

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
