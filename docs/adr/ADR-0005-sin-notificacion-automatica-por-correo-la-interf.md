# ADR-0005: Sin notificación automática por correo: la interfaz dice lo que ocurre

- **Estado:** current
- **Familia:** tracking
- **Decide:** engineering

## Decisión

El escalado escribe un registro en la base y nada más. El copy en los cuatro idiomas describe exactamente eso.

## Alternativas descartadas

- Enviar un correo a la compañía al escalado: descartado por ahora. `src/lib/email.ts` lanza error con `NODE_ENV=production` y el deploy no transporta `RESEND_API_KEY`. No se puede prometer un envío que el código no puede hacer.
- Dejar la copia anterior, que afirmaba que se había avisado a la empresa y al coordinador: descartado. Era falso. Es la misma clase de mentira que invalida la reclamación.

## Consecuencias

- La afirmación pública coincide con lo que el sistema hace.
- Si algún día se añade salida real, primero hay que acordar el canal y después cambiar la copia. Nunca al revés.

## Riesgo que controla

drift:resend-prod-block

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
