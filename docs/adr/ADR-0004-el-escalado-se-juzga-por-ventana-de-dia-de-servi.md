# ADR-0004: El escalado se juzga por ventana de día de servicio, con índice único parcial

- **Estado:** current
- **Familia:** tracking
- **Decide:** engineering

## Decisión

Se crea una incidencia solo cuando la ventana de un día de servicio alcanza 3 reportes negativos. Un índice único parcial `ON (lineId, serviceDate) WHERE status <> 'resolved'` impide duplicados bajo concurrencia.

## Alternativas descartadas

- Contador sobre el histórico completo de la línea: descartado. Eran 3 reportes en toda la vida del registro, sin forma de resetear: la línea quedaba escalada para siempre y el panel lo publicaría así.
- Transacción `READ COMMITTED` sin índice único: descartado. Dos reportes negativos simultáneos ambos veían `null` y ambos abrían incidencia; resolver una dejaba la otra abierta.

## Consecuencias

- La creación espera `Serializable` y trata la violación de clave como resultado esperado, no como fallo.
- `windowStart`/`windowEnd` derivan del día y se filtran junto a `serviceDate` para que describan comportamiento, no columnas decorativas.

## Riesgo que controla

drift:compute-ephemerality

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
