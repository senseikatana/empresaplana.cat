-- Persistencia de reportes ciudadanos y escalados por ventana de servicio.
--
-- "Report" ya existía para el CRUD del panel de gestión. Se le añaden las
-- columnas que necesita el reporte anónimo de la app pública, de modo que el
-- panel deje de estar desconectado de lo que reportan los usuarios.
--
-- Se crea "Escalation" con ventana explícita: cada día de servicio tiene su
-- propio umbral y un estado resoluble. Sustituye al contador acumulado de
-- "toda la historia de la línea" que vivía en un JSON en disco y que nunca
-- podía volver a cerrarse.

-- ── Vocabulario canónico de "action" ─────────────────────────────────────────
-- El CRUD de gestión usaba valores snake_case (on_time, not_passed) mientras
-- que la API pública usaba camelCase (onTime, notPassed). Se normaliza a
-- camelCase, que es el que ya usan las claves i18n en los cuatro idiomas.
UPDATE "Report" SET "action" = 'onTime'    WHERE "action" = 'on_time';
UPDATE "Report" SET "action" = 'notPassed' WHERE "action" = 'not_passed';

-- ── Columnas nuevas ─────────────────────────────────────────────────────────
ALTER TABLE "Report"
  ADD COLUMN IF NOT EXISTS "stopId"      VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "source"      VARCHAR(20) NOT NULL DEFAULT 'citizen',
  ADD COLUMN IF NOT EXISTS "serviceDate" DATE,
  ADD COLUMN IF NOT EXISTS "reporterKey" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "Report_lineId_serviceDate_idx" ON "Report" ("lineId", "serviceDate");
CREATE INDEX IF NOT EXISTS "Report_reporterKey_idx" ON "Report" ("reporterKey");
-- El cuadro de mando público filtra por ventana sin conocer la línea: sin este
-- índice sería un escaneo secuencial de "Report" en cada render.
CREATE INDEX IF NOT EXISTS "Report_serviceDate_idx" ON "Report" ("serviceDate");

-- NOT VALID: no revalida filas históricas, pero sí se aplica a toda inserción
-- y actualización posterior. Evita que una anomalía pretérita bloquee el
-- despliegue.
ALTER TABLE "Report"
  DROP CONSTRAINT IF EXISTS "Report_action_check";
ALTER TABLE "Report"
  ADD CONSTRAINT "Report_action_check"
  CHECK ("action" IN ('passed','onTime','late','early','notPassed','cancelled')) NOT VALID;

ALTER TABLE "Report"
  DROP CONSTRAINT IF EXISTS "Report_source_check";
ALTER TABLE "Report"
  ADD CONSTRAINT "Report_source_check"
  CHECK ("source" IN ('citizen','operator'));

ALTER TABLE "Report"
  DROP CONSTRAINT IF EXISTS "Report_minutesLate_check";
ALTER TABLE "Report"
  ADD CONSTRAINT "Report_minutesLate_check"
  CHECK ("minutesLate" IS NULL OR "minutesLate" BETWEEN 0 AND 1440);

-- ── Escalados ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Escalation" (
  "id"            SERIAL        NOT NULL,
  "lineId"        VARCHAR(40)   NOT NULL,
  "serviceDate"   DATE,
  "windowStart"   TIMESTAMP(3)  NOT NULL,
  "windowEnd"     TIMESTAMP(3)  NOT NULL,
  "threshold"     INTEGER       NOT NULL DEFAULT 3,
  "negativeCount" INTEGER       NOT NULL DEFAULT 0,
  "status"        VARCHAR(20)   NOT NULL DEFAULT 'open',
  "notifiedAt"    TIMESTAMP(3),
  "resolvedAt"    TIMESTAMP(3),
  "resolvedBy"    VARCHAR(120),
  "note"          VARCHAR(1000),
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Escalation_status_check"
    CHECK ("status" IN ('open','acknowledged','resolved')),
  CONSTRAINT "Escalation_window_check"
    CHECK ("windowEnd" > "windowStart"),
  CONSTRAINT "Escalation_resolved_check"
    CHECK (("status" = 'resolved') = ("resolvedAt" IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS "Escalation_lineId_status_idx" ON "Escalation" ("lineId", "status");
CREATE INDEX IF NOT EXISTS "Escalation_serviceDate_idx" ON "Escalation" ("serviceDate");
CREATE INDEX IF NOT EXISTS "Escalation_status_idx" ON "Escalation" ("status");

-- Una sola incidencia abierta por línea y día de servicio. Sin esto, dos
-- reportes negativos simultáneos abrían dos escalados (lectura seguida de
-- escritura a READ COMMITTED), y resolver uno dejaba el otro abierto para
-- siempre: la línea figuraría escalada en un panel público de forma
-- permanente. `addReport` trata la violación de clave como resultado esperado.
--
-- "serviceDate" pasa a NOT NULL: con la fecha vacía el escalado queda huérfano
-- y no coincide con ninguna ventana.
ALTER TABLE "Escalation"
  ALTER COLUMN "serviceDate" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Escalation_open_window_unique"
  ON "Escalation" ("lineId", "serviceDate")
  WHERE "status" <> 'resolved';

-- Los reportes que dispararon un escalado quedan enlazados: son la evidencia
-- que necesita la reclamación formal.
--
-- Prisma 7 deriva la tabla de unión implícita N:M como `_AToB` en camelCase
-- (`_EscalationToReport`), no `_A_to_B` como en versiones anteriores.
CREATE TABLE IF NOT EXISTS "_EscalationToReport" (
  "A" INTEGER NOT NULL,
  "B" INTEGER NOT NULL,
  CONSTRAINT "_EscalationToReport_AB_pkey" PRIMARY KEY ("A","B"),
  CONSTRAINT "_EscalationToReport_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Escalation" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_EscalationToReport_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Report" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "_EscalationToReport_B_index" ON "_EscalationToReport" ("B");
CREATE INDEX IF NOT EXISTS "_EscalationToReport_A_index" ON "_EscalationToReport" ("A");

-- ── Valoraciones ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Review" (
  "id"        SERIAL       NOT NULL,
  "lineId"    VARCHAR(40)  NOT NULL,
  "stars"     INTEGER      NOT NULL,
  "comment"   VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Review_stars_check" CHECK ("stars" BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS "Review_lineId_idx" ON "Review" ("lineId");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review" ("createdAt");
