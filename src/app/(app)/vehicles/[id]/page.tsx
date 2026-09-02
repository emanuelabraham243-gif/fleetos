import { notFound } from "next/navigation";

import { GpsStatusBadge } from "@/components/gps-status-badge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsTab } from "@/components/vehicles/detail/documents-tab";
import { ExpensesTab } from "@/components/vehicles/detail/expenses-tab";
import { FuelTab } from "@/components/vehicles/detail/fuel-tab";
import { HistoryTab } from "@/components/vehicles/detail/history-tab";
import { IncidentsTab } from "@/components/vehicles/detail/incidents-tab";
import { LiveTrackingSection } from "@/components/vehicles/detail/live-tracking-section";
import { MaintenanceTab } from "@/components/vehicles/detail/maintenance-tab";
import { OverviewSection } from "@/components/vehicles/detail/overview-section";
import { TripsTab } from "@/components/vehicles/detail/trips-tab";
import { VehicleActionsBar } from "@/components/vehicles/detail/vehicle-actions-bar";
import { getDrivers } from "@/lib/data/drivers";
import { getVehicleAssignmentHistory } from "@/lib/data/driver-assignments";
import { getVehicleExpenses } from "@/lib/data/expenses";
import { computeFuelMetrics, getVehicleFuelTransactions } from "@/lib/data/fuel";
import { getRecentGpsEvents } from "@/lib/data/gps-events";
import { getVehicleIncidents } from "@/lib/data/incidents";
import { getVehicleMaintenance } from "@/lib/data/maintenance";
import { getCurrentProfile } from "@/lib/data/profile";
import { getRevenueByTripIds } from "@/lib/data/revenue";
import { getVehicleDocuments } from "@/lib/data/vehicle-documents";
import { getVehicleFinancialSummary } from "@/lib/data/vehicle-finance";
import { getVehicleHistory } from "@/lib/data/vehicle-history";
import { getVehicleById, getVehicleTrips } from "@/lib/data/vehicles";
import { isActiveTripStatus } from "@/lib/domain/trip";
import { canManageFleet } from "@/lib/domain/permissions";
import { computeVehicleOperationalStatus } from "@/lib/domain/vehicle";
import { computeGpsStatus } from "@/lib/gps/status";
import { VEHICLE_OPERATIONAL_STATUS_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const vehicle = await getVehicleById(supabase, id);
  if (!vehicle) {
    notFound();
  }

  const [
    profile,
    trips,
    assignmentHistory,
    financials,
    recentGpsEvents,
    fuelTransactions,
    expenses,
    maintenance,
    documents,
    incidents,
    history,
    allDrivers,
  ] = await Promise.all([
    getCurrentProfile(),
    getVehicleTrips(supabase, id, 50),
    getVehicleAssignmentHistory(supabase, id),
    getVehicleFinancialSummary(supabase, id),
    getRecentGpsEvents(supabase, id, 10),
    getVehicleFuelTransactions(supabase, id),
    getVehicleExpenses(supabase, id),
    getVehicleMaintenance(supabase, id),
    getVehicleDocuments(supabase, id),
    getVehicleIncidents(supabase, id),
    getVehicleHistory(supabase, id),
    getDrivers(supabase),
  ]);

  const revenueByTrip = await getRevenueByTripIds(supabase, trips.map((t) => t.id));

  const activeTrip = trips.find((t) => isActiveTripStatus(t.status)) ?? null;
  const currentAssignment = assignmentHistory.find((a) => !a.unassigned_at) ?? null;
  const driverName = activeTrip?.driver?.full_name ?? currentAssignment?.driver?.full_name ?? null;

  const gpsStatus = computeGpsStatus(vehicle.vehicle_locations?.recorded_at);
  const operationalStatus = computeVehicleOperationalStatus(
    vehicle.status,
    activeTrip !== null,
    gpsStatus,
  );

  const canManage = profile ? canManageFleet(profile.role) : false;
  const fuelMetrics = computeFuelMetrics(fuelTransactions);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Unit {vehicle.unit_number}</h1>
            <Badge variant="outline">{VEHICLE_OPERATIONAL_STATUS_LABEL[operationalStatus]}</Badge>
            <GpsStatusBadge recordedAt={vehicle.vehicle_locations?.recorded_at} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {vehicle.license_plate ?? "No plate on file"}
            {driverName ? ` · ${driverName}` : " · Unassigned"}
          </p>
        </div>
        <VehicleActionsBar
          vehicleId={vehicle.id}
          canManage={canManage}
          operationalStatus={operationalStatus}
          drivers={allDrivers.map((d) => ({ id: d.id, full_name: d.full_name }))}
          currentDriverId={currentAssignment?.driver_id ?? null}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live-tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="fuel">Fuel</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewSection
            vehicle={vehicle}
            activeTrip={activeTrip}
            driverName={driverName}
            financials={financials}
          />
        </TabsContent>
        <TabsContent value="live-tracking" className="mt-4">
          <LiveTrackingSection
            vehicle={vehicle}
            recentEvents={recentGpsEvents}
            driverName={driverName}
            tripLabel={
              activeTrip ? `${activeTrip.origin ?? "?"} → ${activeTrip.destination ?? "?"}` : null
            }
          />
        </TabsContent>
        <TabsContent value="trips" className="mt-4">
          <TripsTab trips={trips} revenueByTrip={revenueByTrip} />
        </TabsContent>
        <TabsContent value="fuel" className="mt-4">
          <FuelTab transactions={fuelTransactions} metrics={fuelMetrics} />
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab expenses={expenses} />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          <MaintenanceTab maintenance={maintenance} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab documents={documents} />
        </TabsContent>
        <TabsContent value="incidents" className="mt-4">
          <IncidentsTab incidents={incidents} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab events={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
