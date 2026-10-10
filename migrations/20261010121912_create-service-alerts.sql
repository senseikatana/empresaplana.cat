-- Public service alerts (incidents, detours, schedule changes) per line.
-- line_id intentionally has no FK: `bun run sync:sheets` replaces public."Line".

CREATE TABLE public.service_alerts (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  line_id     integer,
  severity    text NOT NULL DEFAULT 'info'
              CHECK (severity IN ('info', 'warning', 'critical')),
  title       text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  message     text NOT NULL CHECK (char_length(message) BETWEEN 3 AND 2000),
  locale      text NOT NULL DEFAULT 'es' CHECK (locale IN ('ca', 'es', 'en', 'fr')),
  starts_at   timestamptz NOT NULL DEFAULT now(),
  ends_at     timestamptz,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX service_alerts_line_id_idx ON public.service_alerts (line_id);
CREATE INDEX service_alerts_active_window_idx
  ON public.service_alerts (starts_at, ends_at) WHERE is_active;

CREATE OR REPLACE FUNCTION public.service_alerts_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER service_alerts_touch_updated_at
  BEFORE UPDATE ON public.service_alerts
  FOR EACH ROW EXECUTE FUNCTION public.service_alerts_touch_updated_at();

-- Public read-only: writes happen server-side (admin/API key or Prisma).
ALTER TABLE public.service_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.service_alerts FROM anon, authenticated;
GRANT SELECT ON public.service_alerts TO anon, authenticated;

CREATE POLICY service_alerts_public_read ON public.service_alerts
  FOR SELECT TO anon, authenticated
  USING (is_active AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

-- Sample data (requested by the user), clearly tagged [DEMO].
INSERT INTO public.service_alerts (line_id, severity, title, message, locale, starts_at, ends_at) VALUES
  (-1001, 'warning',  '[DEMO] Desvío en Tarragona centro',
   'Por obras en la Rambla Nova, las paradas de Imperial Tarraco se trasladan provisionalmente a la calle Pere Martell.',
   'es', now() - interval '1 day', now() + interval '14 days'),
  (-1001, 'info',     '[DEMO] Horari d''estiu',
   'A partir de l''1 de juliol s''activen les sortides addicionals de La Pineda cada 30 minuts.',
   'ca', now(), now() + interval '60 days'),
  (-1002, 'critical', '[DEMO] Service suspended due to storm',
   'Salou – Cambrils service is suspended until further notice because of severe weather.',
   'en', now() - interval '2 hours', now() + interval '1 day'),
  (-1002, 'info',     '[DEMO] Nueva parada en Passeig Jaume I',
   'La línea incorpora una parada en Passeig Jaume I (Salou) en ambos sentidos.',
   'es', now(), NULL),
  (NULL,  'info',     '[DEMO] Atención al cliente',
   'Las oficinas de atención al cliente cierran el 24 y 31 de diciembre a las 14:00.',
   'es', now() - interval '30 days', now() - interval '1 day');
