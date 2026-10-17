# Registros de decisión de arquitectura

Un ADR por decisión. No por cambio: por decisión. Un fichero nuevo que solo
reordena código no lleva ADR.

## Formato

Cada uno tiene: **estado** (`current` o `proposed`), **familia** (a qué mapa de
decisiones pertenece), **la decisión en una frase**, **qué alternativas se
descartaron y por qué**, **consecuencias**, y **qué riesgo retira**.

Las alternativas descartadas no son decoración: son la parte que impide que
dentro de dos años alguien vuelva a plantear la que ya se descartó con
argumentos.

## Índice

| ADR | Decisión | Familia | Estado |
| --- | --- | --- | --- |
| [0001](ADR-0001-astro-con-render-en-servidor-y-adaptador-node-st.md) | Astro con render en servidor y adaptador Node standalone | architecture | current |
| [0002](ADR-0002-google-sheets-es-la-fuente-de-verdad-de-paradas.md) | Google Sheets es la fuente de verdad de paradas; Postgres el modelo de lectura | data-authority | current |
| [0003](ADR-0003-los-reportes-ciudadanos-persisten-en-postgres-no.md) | Los reportes ciudadanos persisten en Postgres, no en disco | tracking | current |
| [0004](ADR-0004-el-escalado-se-juzga-por-ventana-de-dia-de-servi.md) | El escalado se juzga por ventana de día de servicio, con índice único | tracking | current |
| [0005](ADR-0005-sin-notificacion-automatica-por-correo-la-interf.md) | Sin notificación automática: la interfaz dice lo que ocurre | tracking | current |
| [0006](ADR-0006-las-apis-de-reporte-son-publicas-por-diseno-con.md) | APIs de reporte públicas por diseño, tope duro en la base | auth | current |
| [0007](ADR-0007-el-identificador-de-cliente-se-deriva-con-hmac-y.md) | El identificador de cliente usa HMAC, no un hash de forma libre | auth | current |
| [0008](ADR-0008-el-dia-de-servicio-se-ancla-en-europe-madrid-con.md) | El día de servicio se ancla en Europe/Madrid con corte a las 02:00 | architecture | current |
| [0009](ADR-0009-se-sirve-sin-prefijo-para-espanol-y-con-prefijo.md) | Español sin prefijo, el resto con prefijo | auth | current |
| [0010](ADR-0010-el-contrato-de-tiempo-real-es-gtfs-realtime-ning.md) | El contrato de tiempo real es GTFS-Realtime, ninguna API privada | realtime | **proposed** |
| [0011](ADR-0011-la-integracion-con-la-compania-es-por-fichero-xl.md) | La integración con la compañía es por fichero `.xlsx`/`.csv` | data-authority | **proposed** |
| [0012](ADR-0012-un-unico-gate-de-verificacion-y-astro-build-qued.md) | Un único gate de verificación, `astro build` fuera a propósito | delivery | current |

## Reglas

- Un ADR en `proposed` es una decisión **discutida pero no ejecutada**. Nadie
  implementa en una dirección que contradiga un `proposed` sin levantar la
  decisión primero.
- `current` no significa terminado: significa que es lo que se hace. Pasa a
  `revertida` si se cae para atrás, y a `superseded` solo con otro ADR de la
  misma familia.
- El registro de familia está en `../decisions/manifest.json`. El ADR explica
  *por qué*; el manifiesto declara *qué familias hay* y en qué estado están.
  Si la pareja deja de cuadrar, gana el ADR y se arregla el manifiesto.

---

**Ver también:** `../decisions/manifest.json` · `../program/README.md` ·
`../risks/README.md`
