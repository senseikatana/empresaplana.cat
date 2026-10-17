# ADR-0009: Se sirve sin prefijo para español y con prefijo para el resto

- **Estado:** current
- **Familia:** auth
- **Decide:** engineering

## Decisión

`/`, `/rutas-horarios`, `/dashboard/login`, `/perfil` son español sin prefijo; `/es/...` redirige 308 al equivalente sin prefijo. `ca`, `en`, `fr` conservan prefijo.

## Alternativas descartadas

- Prefijar también español: descartado. Cambia la URL de la que ya salen enlaces y convierte una preferencia en redirección.
- Enrutar por cabecera `Accept-Language`: descartado. Rompe URLs compartibles y canonicals.

## Consecuencias

- Todos los enlaces y redirecciones se construyen con `localizedPath()` de `src/config/i18n/routing.ts`.
- `src/config/i18n/{es,ca,en,fr}.json` tienen que mantener la misma forma: 1045 claves verificadas idénticas en los cuatro.

## Riesgo que controla

drift:insforge-auth

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
