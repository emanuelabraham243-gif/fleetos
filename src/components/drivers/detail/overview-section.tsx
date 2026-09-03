import { Card, CardContent } from "@/components/ui/card";
import type { DriverBoardEntry } from "@/lib/data/driver-board";
import type { DriverOperationalMetrics } from "@/lib/data/driver-metrics";
import { formatDate, formatDateTime } from "@/lib/format-time";
import { DRIVER_STATUS_LABEL } from "@/lib/i18n/labels";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </div>
  );
}

export function DriverOverviewSection({
  driver,
  metrics,
}: {
  driver: DriverBoardEntry;
  metrics: DriverOperationalMetrics;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col">
            <h3 className="mb-2 text-sm font-semibold">Profile</h3>
            <InfoRow label="Full name" value={driver.full_name} />
            <InfoRow label="Phone" value={driver.phone ?? "—"} />
            <InfoRow label="Email" value={driver.email ?? "—"} />
            <InfoRow label="Employee ID" value={driver.employee_id ?? "—"} />
            <InfoRow label="Status" value={DRIVER_STATUS_LABEL[driver.status]} />
            <InfoRow label="Hired" value={driver.hire_date ? formatDate(driver.hire_date) : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col">
            <h3 className="mb-2 text-sm font-semibold">License</h3>
            <InfoRow label="Number" value={driver.license_number ?? "—"} />
            <InfoRow label="Class" value={driver.license_class ?? "—"} />
            <InfoRow
              label="Issued"
              value={driver.license_issued_at ? formatDate(driver.license_issued_at) : "—"}
            />
            <InfoRow
              label="Expires"
              value={driver.license_expiry ? formatDate(driver.license_expiry) : "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col">
            <h3 className="mb-2 text-sm font-semibold">Current Operations</h3>
            <InfoRow
              label="Current vehicle"
              value={driver.currentVehicle ? `Unit ${driver.currentVehicle.unit_number}` : "No current vehicle assigned"}
            />
            <InfoRow
              label="Current trip"
              value={
                driver.activeTrip
                  ? `${driver.activeTrip.trip_number} (${driver.activeTrip.origin ?? "?"} → ${driver.activeTrip.destination ?? "?"})`
                  : "Driver has no active trip"
              }
            />
            <InfoRow
              label="Assigned since"
              value={
                driver.currentAssignment ? formatDateTime(driver.currentAssignment.assigned_at) : "—"
              }
            />
            <InfoRow label="Last activity" value={formatDateTime(driver.updated_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{driver.notes ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold">Operational Performance</h3>
            <p className="text-muted-foreground text-xs">
              Plain counts, not a combined score -- each figure is one fact about this driver&apos;s
              record.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Completed Trips" value={String(metrics.completedTrips)} />
            <MetricCard label="Active Trips" value={String(metrics.activeTrips)} />
            <MetricCard label="Completed Deliveries" value={String(metrics.completedDeliveries)} />
            <MetricCard label="Partial Deliveries" value={String(metrics.partiallyDeliveredDeliveries)} />
            <MetricCard label="Refused Deliveries" value={String(metrics.refusedDeliveries)} />
            <MetricCard label="Damaged Deliveries" value={String(metrics.damagedDeliveries)} />
            <MetricCard label="Incidents" value={String(metrics.incidentCount)} />
            <MetricCard
              label="Total Distance"
              value={metrics.totalDistanceKm !== null ? `${metrics.totalDistanceKm.toLocaleString()} km` : "No data yet"}
              hint="Completed trips with a recorded distance"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
