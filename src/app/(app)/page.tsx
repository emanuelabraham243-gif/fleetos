import { Card, CardContent } from "@/components/ui/card";
import { ActiveTrips } from "@/components/command-center/active-trips";
import { AttentionRequired } from "@/components/command-center/attention-required";
import { FleetSummaryCards } from "@/components/command-center/fleet-summary-cards";
import { QuickActions } from "@/components/command-center/quick-actions";
import { RecentActivity } from "@/components/command-center/recent-activity";
import { SyncGpsButton } from "@/components/command-center/sync-gps-button";
import { VehicleOperationsList } from "@/components/command-center/vehicle-operations-list";
import { FleetMapLoader } from "@/components/fleet-map-loader";
import type { FleetMapVehicle } from "@/components/fleet-map";
import { getAttentionItems } from "@/lib/data/attention";
import { getRecentActivity } from "@/lib/data/activity";
import { buildFleetBoard, summarizeFleet } from "@/lib/data/fleet";
import { getActiveTrips } from "@/lib/data/trips";
import { getVehicles } from "@/lib/data/vehicles";
import { formatGpsFreshness } from "@/lib/gps/status";
import { createClient } from "@/lib/supabase/server";

export default async function CommandCenterPage() {
  const supabase = await createClient();

  const [vehicles, activeTrips] = await Promise.all([
    getVehicles(supabase),
    getActiveTrips(supabase),
  ]);

  const fleetBoard = buildFleetBoard(vehicles, activeTrips);
  const summary = summarizeFleet(fleetBoard);
  const vehiclesById = new Map(fleetBoard.map((vehicle) => [vehicle.id, vehicle]));
  const unitNumberByVehicleId = new Map(
    fleetBoard.map((vehicle) => [vehicle.id, vehicle.unit_number]),
  );

  const [attentionItems, activityEvents] = await Promise.all([
    getAttentionItems(supabase, fleetBoard),
    getRecentActivity(supabase),
  ]);

  const mapVehicles: FleetMapVehicle[] = fleetBoard.map((vehicle) => {
    const location = vehicle.vehicle_locations;
    const { label: freshnessLabel } = formatGpsFreshness(location?.recorded_at);
    return {
      id: vehicle.id,
      unitNumber: vehicle.unit_number,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      gpsStatus: vehicle.gpsStatus,
      freshnessLabel,
      speedKph: location?.speed_kph ?? null,
      ignitionOn: location?.ignition_on ?? null,
      operationalStatus: vehicle.operationalStatus,
      driverName: vehicle.activeTrip?.driver?.full_name ?? null,
      tripLabel: vehicle.activeTrip
        ? `${vehicle.activeTrip.origin ?? "?"} → ${vehicle.activeTrip.destination ?? "?"}`
        : null,
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fleet status as of right now.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="order-1 lg:order-1 lg:col-span-3">
          <FleetSummaryCards summary={summary} />
        </div>

        <div className="order-2 lg:order-2 lg:col-span-3">
          <QuickActions />
        </div>

        <div className="order-6 lg:order-3 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Live Fleet Map
            </h2>
            <SyncGpsButton />
          </div>
          <Card className="h-96 overflow-hidden p-0">
            <CardContent className="h-full p-0">
              <FleetMapLoader vehicles={mapVehicles} />
            </CardContent>
          </Card>
        </div>

        <div className="order-3 lg:order-3 lg:col-span-1">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Attention Required
          </h2>
          <AttentionRequired items={attentionItems} />
        </div>

        <div className="order-5 lg:order-4 lg:col-span-3">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Vehicle Operations
          </h2>
          <VehicleOperationsList vehicles={fleetBoard} />
        </div>

        <div className="order-4 lg:order-5 lg:col-span-3">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Active Trips
          </h2>
          <ActiveTrips trips={activeTrips} vehiclesById={vehiclesById} />
        </div>

        <div className="order-7 lg:order-6 lg:col-span-3">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Recent Activity
          </h2>
          <RecentActivity events={activityEvents} unitNumberByVehicleId={unitNumberByVehicleId} />
        </div>
      </div>
    </div>
  );
}
