# Programa

Documento de operación **entre departamentos**. Aquí queda qué se decide
fuera de ingeniería y con quién se habla para cada cosa. No es documentación de
código: es el contrato de turno.

## Los cuatro departamentos que tocan este proyecto

| Departamento | Pregunta que le corresponde | Artefacto | No le toca |
| --- | --- | --- | --- |
| **ingeniería** | ¿es correcto y puede desplegarse? | `docs/architecture/`, `docs/adr/`, `bun run verify` | si el horario de un pueblo cambia |
| **producto** | ¿qué promete la pantalla y se cumple? | `docs/decisions/manifest.json` (familia `realtime`) | el diseño de tablas |
| **legal** | ¿qué afirmamos por escrito y lo podemos sostener? | `docs/reclamacion.md` | la implementación |
| **negocio / la compañía** | ¿qué datos reales nos dan y cuándo? | entrada a `data-authority` | nuestra base de datos |

## Regla que gobierna todo

**La pantalla nunca dice algo que el sistema no hace.**

No es un estilo: es la condición para que la reclamación formal sirva. Si el
panel afirma que se avisó a la compañía y el sistema no envía nada, la carta
pierde valor y con ella la posición de negociación.

Referencia viva:

- `src/lib/email.ts` lanza error con `NODE_ENV=production` y el deploy no
  transporta `RESEND_API_KEY`. **Hoy no se puede enviar correo desde el código
  en producción.**
- Por eso el copy de los cuatro idiomas dice que la incidencia queda
  *registrada* y *visible en el panel de gestión*, que es exactamente lo que
  ocurre. ADR-0005.

Si algún día se añade salida real, se cambia **primero** el sistema y
**después** la copia. Nunca al revés.

## Ciclo de decisión por familia

```
  ┌─ abierta ──────► decidida ─────► implementada ─────► vigente ─┐
  │   (proposed)                                            (current)│
  └──────────────── de vuelta a 'proposed' si cambia el contexto ────┘
                        (solo con ADR nuevo en la MISMA familia)
```

- **Estado inicial:** `proposed`. Las decisiones vivas van a `current`.
- **Nunca a `superseded`** sin que un ADR de la misma familia lo reemplace.
  Una familia no se apaga por olvido.
- **Revisión sin decisión:** se permite de `current` a `proposed` cuando cambia
  algo de fuera (un riesgo `open`). Eso no es un retroceso, es señalar que la
  decisión ya no está sostenida por su contexto.
- **Cierre por implementación:** se permite de `implementada` a `current`
  únicamente con una referencia al pull request o al commit en el propio ADR.

Cada familia se valida **por separado**. Se puede cerrar una sin tocar las
otras; eso es para qué existe la partición.

## Momentos en que hay que abrir una decisión

1. Alguien propone tocar `email.ts`, el copy de notificación, o el estado de un
   escalado → familia `tracking`, ADR-0005 en juego.
2. Alguien propone meter una API de terceros para tiempo real → familia
   `realtime`. ADR-0010 está `proposed`: hay que cambiarlo o rechazarlo, no
   desviarse en silencio.
3. Cambia la plantilla de Google Sheets o alguien quiere editar las paradas en
   Postgres → familia `data-authority`, ADR-0002.
4. Cambia `prisma.config.ts`, se añade un `.sql`, o se toca `schema.prisma` →
   correr `bun run db:drift` antes y después.
5. Cambia el rol de un recurso del CRUD → familia `auth`, ADR-0006.

## Punto de revisión entre ingeniería y el resto

Una vez por ciclo, mirando `docs/decisions/manifest.json`:

- ¿Hay alguna familia `proposed` que ya debería estar `current`?
- ¿Hay algún riesgo `open` con mucho tiempo en `open`? Hoy hay dos, y los dos
  bloquean tiempo real: `drift:missing-stop-coordinates` y
  `drift:no-trip-entity`.
- ¿Siguen `es|ca|en|fr` con la misma forma? (1045 claves idénticas.)
- ¿`bun run db:drift` sigue en verde?

---

**Ver también:** `../decisions/manifest.json` · `../risks/README.md` ·
`../adr/README.md` · `../reclamacion.md`
