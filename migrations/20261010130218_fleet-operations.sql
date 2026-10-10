-- Fleet operations (vehicle documents with expiry, incidents, maintenance).
-- Ported from the Bolt intranet prototype; tables mirror prisma/schema.prisma.

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" SERIAL NOT NULL,
    "busId" INTEGER NOT NULL,
    "docType" VARCHAR(30) NOT NULL,
    "reference" VARCHAR(80) NOT NULL DEFAULT '',
    "expiresOn" DATE NOT NULL,
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" SERIAL NOT NULL,
    "busId" INTEGER,
    "driverId" INTEGER,
    "occurredOn" DATE NOT NULL,
    "severity" VARCHAR(10) NOT NULL DEFAULT 'low',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "description" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "busId" INTEGER NOT NULL,
    "serviceOn" DATE NOT NULL,
    "kind" VARCHAR(20) NOT NULL DEFAULT 'preventive',
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "description" VARCHAR(2000) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleDocument_busId_idx" ON "VehicleDocument"("busId");

-- CreateIndex
CREATE INDEX "VehicleDocument_expiresOn_idx" ON "VehicleDocument"("expiresOn");

-- CreateIndex
CREATE INDEX "Incident_busId_idx" ON "Incident"("busId");

-- CreateIndex
CREATE INDEX "Incident_driverId_idx" ON "Incident"("driverId");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Maintenance_busId_idx" ON "Maintenance"("busId");

-- CreateIndex
CREATE INDEX "Maintenance_status_idx" ON "Maintenance"("status");

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Integrity: closed vocabularies and sane values.
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_docType_check"
  CHECK ("docType" IN ('itv', 'insurance', 'tachograph', 'transport_card', 'circulation_permit', 'other'));
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_severity_check"
  CHECK ("severity" IN ('low', 'medium', 'high'));
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_status_check"
  CHECK ("status" IN ('open', 'in_progress', 'resolved'));
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_kind_check"
  CHECK ("kind" IN ('preventive', 'corrective'));
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_status_check"
  CHECK ("status" IN ('scheduled', 'in_progress', 'completed'));
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_cost_check" CHECK ("cost" >= 0);

-- Server-only access (Prisma as table owner), same as the other fleet tables.
ALTER TABLE "VehicleDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Incident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Maintenance" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "VehicleDocument", "Incident", "Maintenance" FROM anon, authenticated;

-- [DEMO] sample rows on the DEMO buses (skipped if they do not exist).
INSERT INTO "VehicleDocument" ("busId", "docType", "reference", "expiresOn", "notes", "updatedAt")
SELECT b.id, d.doc_type, d.reference, current_date + d.days, '[DEMO]', now()
FROM "Bus" b
JOIN (VALUES
  ('DEMO-1', 'itv', 'ITV-DEMO-001', -5),
  ('DEMO-1', 'insurance', 'POL-DEMO-001', 20),
  ('DEMO-1', 'tachograph', 'TAC-DEMO-001', 300),
  ('DEMO-2', 'itv', 'ITV-DEMO-002', 120),
  ('DEMO-2', 'transport_card', 'TT-DEMO-002', 10)
) AS d(number, doc_type, reference, days) ON d.number = b.number;

INSERT INTO "Incident" ("busId", "occurredOn", "severity", "status", "description", "updatedAt")
SELECT b.id, current_date + d.days, d.severity, d.status, d.description, now()
FROM "Bus" b
JOIN (VALUES
  ('DEMO-1', -2, 'medium', 'open', '[DEMO] Aire acondicionado sin funcionar en el trayecto Tarragona - Salou.'),
  ('DEMO-2', -10, 'low', 'resolved', '[DEMO] Retrovisor derecho rayado en cocheras.')
) AS d(number, days, severity, status, description) ON d.number = b.number;

INSERT INTO "Maintenance" ("busId", "serviceOn", "kind", "status", "description", "cost", "updatedAt")
SELECT b.id, current_date + d.days, d.kind, d.status, d.description, d.cost, now()
FROM "Bus" b
JOIN (VALUES
  ('DEMO-1', 3, 'corrective', 'scheduled', '[DEMO] Revisión del compresor del aire acondicionado.', 450.00),
  ('DEMO-2', -30, 'preventive', 'completed', '[DEMO] Cambio de aceite y filtros (60.000 km).', 320.50)
) AS d(number, days, kind, status, description, cost) ON d.number = b.number;
