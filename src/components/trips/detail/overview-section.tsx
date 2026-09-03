import { Card, CardContent } from "@/components/ui/card";
import type { TripDetail } from "@/lib/data/trips";
import { formatDateTime } from "@/lib/format-time";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function OverviewSection({ trip }: { trip: TripDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="flex flex-col">
          <h3 className="mb-2 text-sm font-semibold">Route & Schedule</h3>
          <InfoRow label="Origin" value={trip.origin ?? "—"} />
          <InfoRow label="Destination" value={trip.destination ?? "—"} />
          <InfoRow label="Distance" value={trip.distance_km !== null ? `${trip.distance_km} km` : "—"} />
          <InfoRow
            label="Scheduled start"
            value={trip.scheduled_start ? formatDateTime(trip.scheduled_start) : "—"}
          />
          <InfoRow
            label="Scheduled end"
            value={trip.scheduled_end ? formatDateTime(trip.scheduled_end) : "—"}
          />
          <InfoRow
            label="Actual start"
            value={trip.actual_start ? formatDateTime(trip.actual_start) : "Not yet departed"}
          />
          <InfoRow
            label="Actual end"
            value={trip.actual_end ? formatDateTime(trip.actual_end) : "Not yet completed"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col">
          <h3 className="mb-2 text-sm font-semibold">Assignment</h3>
          <InfoRow label="Vehicle" value={trip.vehicle ? `Unit ${trip.vehicle.unit_number}` : "—"} />
          <InfoRow label="Driver" value={trip.driver?.full_name ?? "Unassigned"} />
          <InfoRow label="Client" value={trip.client?.name ?? "No client on record"} />
          <InfoRow label="Reference number" value={trip.reference_number ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col">
          <h3 className="mb-2 text-sm font-semibold">Cargo</h3>
          <InfoRow label="Description" value={trip.cargo_description ?? "—"} />
          <InfoRow
            label="Quantity"
            value={
              trip.cargo_quantity !== null
                ? `${trip.cargo_quantity}${trip.cargo_quantity_unit ? ` ${trip.cargo_quantity_unit}` : ""}`
                : "—"
            }
          />
          <InfoRow
            label="Weight"
            value={trip.cargo_weight_kg !== null ? `${trip.cargo_weight_kg} kg` : "—"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Notes</h3>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Customer notes
            </p>
            <p className="text-sm whitespace-pre-wrap">{trip.customer_notes ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Internal notes
            </p>
            <p className="text-sm whitespace-pre-wrap">{trip.notes ?? "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
