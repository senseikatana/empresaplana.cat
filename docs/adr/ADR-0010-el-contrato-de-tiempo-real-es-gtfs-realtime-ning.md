# ADR-0010: El contrato de tiempo real es GTFS-Realtime; ninguna API privada de terceros

- **Estado:** proposed
- **Familia:** realtime
- **Decide:** engineering

## Decisión

Cuando haya posiciones, el objetivo es `VehiclePositions` + `TripUpdates` de GTFS-RT, o algo convertible a él.

## Alternativas descartadas

- API privada de Moovit u otra app comercial: descartada. Es el código y los datos de otros, bajo licencia y sujeto a corte. Un agregado de un tercero no es evidencia autoritativa para una reclamación contra la compañía.
- Reverse engineering de apps ajenas con REA para extraer su endpoint: descartado. Ya se probó: Moovit devuelve 403 a `HeadlessChrome` y está detrás de un WAF que exige resolver un reto. Vencerlo para consumir lo que no podemos usar no compensa.
- Interrogación a su portal Laravel de empleados: descartada. Sería acceso sin autorización. Solo se observó la página pública de login.

## Consecuencias

- GTFS-RT es un estándar público y documentado: no requiere que nadie ceda su implementación, y si la compañía publica su AVL/GPS es exactamente lo que hay que pedir.
- Bloqueos previos que nadie más puede resolver: `Line`/`SchedulesOnLine` no llevan coordenadas, y no existe entidad de expedición con fecha de servicio. Ver `drift:missing-stop-coordinates` y `drift:no-trip-entity`.
- Mientras esa familia siga `proposed`, ningún componente puede afirmar tiempo real.

## Riesgo que controla

drift:missing-stop-coordinates

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
