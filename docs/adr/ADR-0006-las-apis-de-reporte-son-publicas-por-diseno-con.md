# ADR-0006: Las APIs de reporte son públicas por diseño, con tope duro en la base

- **Estado:** current
- **Familia:** auth
- **Decide:** engineering

## Decisión

Sin autenticación: un ciudadano tiene que poder reportar sin cuenta. El tope diario por cliente vive en `Report.reporterKey`; la ráfaga en memoria es la primera barrera y es por instancia a sabiendas.

## Alternativas descartadas

- Login obligatorio para reportar: descartado. Bajará la participación hasta hacer inútil el panel.
- Limitar solo en memoria: descartado. Como no es distribuido, dos réplicas permiten el doble y el límite diario no existiría.
- Limitar solo en base: descartado. Una ráfaga llegaría a Postgres antes de quedar cortada.

## Consecuencias

- La cabecera del cliente se toma solo de `cf-connecting-ip` o `fly-client-ip`, o de la última entrada de `x-forwarded-for`. El `x-forwarded-for` que elige quien llama nunca limita nada.
- El límite en memoria se documenta como no distribuido en la cabecera del propio módulo.

## Riesgo que controla

drift:insforge-auth

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
