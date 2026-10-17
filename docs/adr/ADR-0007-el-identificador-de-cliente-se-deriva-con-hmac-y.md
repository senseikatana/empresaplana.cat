# ADR-0007: El identificador de cliente se deriva con HMAC y no con un hash de forma libre

- **Estado:** current
- **Familia:** auth
- **Decide:** engineering

## Decisión

`reporterKey = HMAC-SHA256(TRACKING_HASH_SECRET, ip)`, truncado a 32 caracteres, sin user-agent.

## Alternativas descartadas

- sha256(IP + user-agent + salt): descartado. El user-agent lo elige quien llama y rotarlo con cada petición anulaba el tope diario y la ráfaga a la vez.
- sha256(salt || ip) con `AUTH_SECRET`: descartado. `AUTH_SECRET` no viaja en el allowlist del deploy, así que en producción la sal habría sido la constante pública `no-salt` — hash sin sal sobre (IP × user-agent), recuperable por fuerza bruta y por tanto dato personal, no pseudónimo.
- sha256(con la cabecera que un atacante controla como sal): descartado. La enumeración prueba `sha256(random || candidato)` y compara contra el valor observado: la cabecera habría sido el candado, no la defensa.

## Consecuencias

- El HMAC exige la clave para evaluar la función, así que evaluar un candidato solo produce `HMAC(k, candidato)` y no hay con qué compararlo.
- `TRACKING_HASH_SECRET` es obligatoria en producción: el código lanza si falta y el script de deploy la exige.

## Riesgo que controla

ninguno

---
Una vez implementada, la orden congelada es el enunciado de la decisión de arriba.
Una revisión no puede cambiarla por una implementación anterior: si la decisión ya
pasó, se registra como **revertida** en esta misma familia.
