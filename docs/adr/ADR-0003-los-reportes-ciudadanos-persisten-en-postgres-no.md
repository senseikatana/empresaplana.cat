# ADR-0003: Los reportes ciudadanos persisten en Postgres, no en un fichero en disco

- **Estado:** current
- **Familia:** tracking
- **Decide:** engineering

## Decisión

`Report`, `Escalation` y `Review` en Postgres. El almacén JSON en `.data/` se eliminó.

## Alternativas descartadas

- Mantener el JSON en disco: descartado. InsForge Compute reemplaza el contenedor y escala a cero, así que cada reporte se perdía en el despliegue. Para una reclamación formal, la evidencia tiene que sobrevivir al reinicio.
- Almacenamiento local de Astro como caché: descartado por el mismo motivo.

## Consecuencias

- Ahora la evidencia es durable y consultable desde el panel de gestión.
- El coste es que las reseñas pasan de ser algo efímero a ser registro con retención: hay que decidir cuánto tiempo se guardan.

## Riesgo que controla

drift:compute-ephemerality

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
