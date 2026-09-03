import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaiseDisputeDialog } from "@/components/disputes/raise-dispute-dialog";
import { DriverActionsBar } from "@/components/drivers/detail/driver-actions-bar";
import { DriverActivityTab } from "@/components/drivers/detail/activity-tab";
import { DriverDeliveriesTab } from "@/components/drivers/detail/deliveries-tab";
import { DriverDisputesTab } from "@/components/drivers/detail/disputes-tab";
import { DriverDocumentsTab } from "@/components/drivers/detail/documents-tab";
import { DriverIncidentsTab } from "@/components/drivers/detail/incidents-tab";
import { DriverOverviewSection } from "@/components/drivers/detail/overview-section";
import { DriverTripsTab } from "@/components/drivers/detail/trips-tab";
import { buildDriverBoard } from "@/lib/data/driver-board";
import { getCurrentAssignmentsByDriver } from "@/lib/data/driver-assignments";
import { getDriverActivity } from "@/lib/data/driver-activity";
import { getDriverDisputes } from "@/lib/data/driver-disputes";
import { getDriverDocumentExpiryDates, getDriverDocuments } from "@/lib/data/driver-documents";
import { getDriverById } from "@/lib/data/drivers";
import { getDeliveriesByDriverId } from "@/lib/data/deliveries";
import { getDriverIncidents } from "@/lib/data/incidents";
import { computeDriverMetrics } from "@/lib/data/driver-metrics";
import { getCurrentProfile } from "@/lib/data/profile";
import { getActiveTrips, getTrips } from "@/lib/data/trips";
import { getVehicles } from "@/lib/data/vehicles";
import { canManageFleet } from "@/lib/domain/permissions";
import { computeDocumentStatus } from "@/lib/domain/document";
import { DRIVER_OPERATIONAL_STATE_LABEL, DRIVER_STATUS_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const driver = await getDriverById(supabase, id);
  if (!driver) {
    notFound();
  }

  const [
    profile,
    activeTrips,
    currentAssignments,
    documentExpiryDates,
    trips,
    deliveries,
    incidents,
    disputes,
    documents,
    vehicles,
  ] = await Promise.all([
    getCurrentProfile(),
    getActiveTrips(supabase),
    getCurrentAssignmentsByDriver(supabase),
    getDriverDocumentExpiryDates(supabase, driver.id),
    getTrips(supabase, { driverId: driver.id }),
    getDeliveriesByDriverId(supabase, driver.id),
    getDriverIncidents(supabase, driver.id),
    getDriverDisputes(supabase, driver.id),
    getDriverDocuments(supabase, driver.id),
    getVehicles(supabase),
  ]);

  const flagged = documentExpiryDates.some((expiresAt) => {
    const status = computeDocumentStatus(expiresAt);
    return status === "EXPIRING_SOON" || status === "EXPIRED";
  });
  const [board] = buildDriverBoard(
    [driver],
    activeTrips,
    currentAssignments,
    new Map([[driver.id, flagged]]),
  );

  const activity = await getDriverActivity(supabase, driver);
  const metrics = computeDriverMetrics(trips, deliveries, incidents);

  const deliveryCountByTripId = new Map<string, number>();
  for (const delivery of deliveries) {
    if (!delivery.trip_id) continue;
    deliveryCountByTripId.set(delivery.trip_id, (deliveryCountByTripId.get(delivery.trip_id) ?? 0) + 1);
  }

  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{driver.full_name}</h1>
            <Badge variant="outline">{DRIVER_STATUS_LABEL[driver.status]}</Badge>
            <Badge variant="secondary">{DRIVER_OPERATIONAL_STATE_LABEL[board.operationalState]}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {board.currentVehicle ? `Unit ${board.currentVehicle.unit_number}` : "No current vehicle"}
            {board.activeTrip
              ? ` · ${board.activeTrip.origin ?? "?"} → ${board.activeTrip.destination ?? "?"}`
              : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DriverActionsBar
            driverId={driver.id}
            canManage={canManage}
            vehicles={vehicles.map((v) => ({ id: v.id, unit_number: v.unit_number }))}
            currentVehicleId={board.currentVehicle?.id ?? null}
            activeTripId={board.activeTrip?.id ?? null}
          />
          <RaiseDisputeDialog driverId={driver.id} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <DriverOverviewSection driver={board} metrics={metrics} />
        </TabsContent>
        <TabsContent value="trips" className="mt-4">
          <DriverTripsTab trips={trips} deliveryCountByTripId={deliveryCountByTripId} />
        </TabsContent>
        <TabsContent value="deliveries" className="mt-4">
          <DriverDeliveriesTab deliveries={deliveries} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DriverDocumentsTab documents={documents} />
        </TabsContent>
        <TabsContent value="incidents" className="mt-4">
          <DriverIncidentsTab incidents={incidents} />
        </TabsContent>
        <TabsContent value="disputes" className="mt-4">
          <DriverDisputesTab disputes={disputes} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <DriverActivityTab events={activity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
