# ADR-0008: El día de servicio se ancla en Europe/Madrid con corte a las 02:00

- **Estado:** current
- **Familia:** architecture
- **Decide:** engineering

## Decisión

Un reporte hecho a las 00:30 en horario de verano pertenece al día de servicio de ese día, no al anterior.

## Alternativas descartadas

- Truncar a UTC: descartado. En CEST (UTC+2) las 00:30 caían en el día anterior, y las dos horas de madrugada quedaban repartidas entre dos servicios distintos.
- Corte a medianoche local: descartado. El cambio de hora desplaza la frontera y produce un día de 23 o 25 horas.

## Consecuencias

- El corte a las 02:00 locales absorbe el cambio de hora.
- `serviceDate` es `@db.Date`, así que la zona horaria solo se resuelve al escribir el límite, no en cada lectura.

## Riesgo que controla

drift:fly-runtime

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
