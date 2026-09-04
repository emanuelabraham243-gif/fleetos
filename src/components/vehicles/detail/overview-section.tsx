import { GpsStatusWithFreshness } from "@/components/gps-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VehicleTrip, VehicleWithLocation } from "@/lib/data/vehicles";
import type { VehicleFinancialSummary } from "@/lib/data/vehicle-finance";
import { formatCurrency } from "@/lib/format-currency";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </>
  );
}

function FinancialRow({
  label,
  value,
  currency,
  emphasize,
}: {
  label: string;
  value: number | null;
  currency: string;
  emphasize?: boolean;
}) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasize ? "font-semibold" : undefined}>
        {value === null ? (
          <span className="text-muted-foreground italic">No data yet</span>
        ) : (
          formatCurrency(value, currency)
        )}
      </span>
    </>
  );
}

export function OverviewSection({
  vehicle,
  activeTrip,
  driverName,
  financials,
}: {
  vehicle: VehicleWithLocation;
  activeTrip: VehicleTrip | null;
  driverName: string | null;
  financials: VehicleFinancialSummary;
}) {
  const location = vehicle.vehicle_locations;
  const hasAnyFinancialData =
    financials.totalRevenue !== null ||
    financials.totalExpenses !== null ||
    financials.fuelCost !== null ||
    financials.maintenanceCost !== null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <InfoRow label="Identifier" value={`Unit ${vehicle.unit_number}`} />
          <InfoRow label="Plate" value={vehicle.license_plate ?? "—"} />
          <InfoRow label="Make / Model" value={[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"} />
          <InfoRow label="Year" value={vehicle.year ? String(vehicle.year) : "—"} />
          <InfoRow label="VIN / Chassis" value={vehicle.vin ?? "—"} />
          <InfoRow label="Engine number" value={vehicle.engine_number ?? "—"} />
          <InfoRow label="Fuel type" value={vehicle.fuel_type} />
          <InfoRow
            label="Capacity"
            value={vehicle.capacity_kg !== null ? `${Number(vehicle.capacity_kg).toLocaleString()} kg` : "—"}
          />
          <InfoRow label="Mileage" value={`${Number(vehicle.odometer_km).toLocaleString()} km`} />
          <InfoRow label="Current driver" value={driverName ?? "Unassigned"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Operational Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <InfoRow label="Status" value={vehicle.status.replace("_", " ")} />
            <InfoRow
              label="Current trip"
              value={
                activeTrip
                  ? `${activeTrip.trip_number} · ${TRIP_STATUS_LABEL[activeTrip.status]}`
                  : "None"
              }
            />
            <InfoRow
              label="Route"
              value={activeTrip ? `${activeTrip.origin ?? "?"} → ${activeTrip.destination ?? "?"}` : "—"}
            />
            <InfoRow
              label="Location"
              value={location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Unknown"}
            />
            <InfoRow label="Speed" value={location?.speed_kph != null ? `${location.speed_kph} km/h` : "—"} />
            <InfoRow
              label="Ignition"
              value={location?.ignition_on == null ? "—" : location.ignition_on ? "ON" : "OFF"}
            />
          </div>
          <div className="border-t pt-3">
            <GpsStatusWithFreshness recordedAt={location?.recorded_at} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {hasAnyFinancialData ? (
            <>
              <FinancialRow label="Total revenue" value={financials.totalRevenue} currency={financials.currency} />
              <FinancialRow label="Fuel cost" value={financials.fuelCost} currency={financials.currency} />
              <FinancialRow
                label="Maintenance cost"
                value={financials.maintenanceCost}
                currency={financials.currency}
              />
              <FinancialRow label="Other expenses" value={financials.totalExpenses} currency={financials.currency} />
              <FinancialRow
                label="Operating cost"
                value={financials.operatingCost}
                currency={financials.currency}
              />
              <FinancialRow
                label="Profit"
                value={financials.profit}
                currency={financials.currency}
                emphasize
              />
              <span className="text-muted-foreground">Cost / km</span>
              <span>
                {financials.costPerKm !== null ? (
                  formatCurrency(financials.costPerKm, financials.currency)
                ) : (
                  <span className="text-muted-foreground italic">Insufficient data</span>
                )}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground col-span-2 py-4 text-center italic">
              No financial data recorded for this vehicle yet.
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
