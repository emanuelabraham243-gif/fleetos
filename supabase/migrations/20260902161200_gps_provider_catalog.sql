-- ============================================================================
-- Seed the GPS provider catalog. These are reference rows describing
-- integration adapters FleetOS supports -- not tenant data -- so they belong
-- in a migration rather than the per-org demo seed.
-- ============================================================================
insert into public.gps_providers (slug, name, integration_type, description) values
  ('mock', 'Mock GPS Provider', 'manual', 'Deterministic simulated GPS feed used for development and demos.'),
  ('generic-rest', 'Generic REST API', 'rest_api', 'Polls a REST endpoint on an interval and normalizes the response.'),
  ('generic-webhook', 'Generic Webhook', 'webhook', 'Receives push events from a provider''s webhook and normalizes them.'),
  ('generic-mqtt', 'Generic MQTT', 'mqtt', 'Subscribes to an MQTT broker topic for device telemetry.'),
  ('generic-tcp', 'Generic TCP/Socket', 'tcp_socket', 'Parses telemetry frames from a raw TCP/socket device stream.'),
  ('generic-sdk', 'Vendor SDK', 'sdk', 'Wraps a vendor-provided SDK/client library.'),
  ('csv-import', 'CSV/Excel Import', 'csv_import', 'Bulk-imports historical or batch location data from spreadsheet exports.'),
  ('database-link', 'Database Integration', 'database', 'Reads location data directly from an external database or view.'),
  ('manual-entry', 'Manual/Custom Integration', 'manual', 'Manually entered or bespoke integration with no standard adapter.')
on conflict (slug) do nothing;
