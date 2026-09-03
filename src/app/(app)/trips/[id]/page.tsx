import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaiseDisputeDialog } from "@/components/disputes/raise-dispute-dialog";
import { DeliveriesSection } from "@/components/trips/detail/deliveries-section";
import { FinancialSection } from "@/components/trips/detail/financial-section";
import { GpsSection } from "@/components/trips/detail/gps-section";
import { OverviewSection } from "@/components/trips/detail/overview-section";
import { StopsSection } from "@/components/trips/detail/stops-section";
import { TimelineSection } from "@/components/trips/detail/timeline-section";
import { TripStatusActions } from "@/components/trips/trip-status-actions";
import { getDeliveriesByTripId } from "@/lib/data/deliveries";
import { getCurrentProfile } from "@/lib/data/profile";
import { getRecentGpsEvents } from "@/lib/data/gps-events";
import { getTripFinancialSummary } from "@/lib/data/trip-finance";
import { getTripStops } from "@/lib/data/trip-stops";
import { getTripTimeline } from "@/lib/data/trip-timeline";
import { getTripById } from "@/lib/data/trips";
import { getVehicleById } from "@/lib/data/vehicles";
import { canManageFleet } from "@/lib/domain/permissions";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const trip = await getTripById(supabase, id);
  if (!trip) {
    notFound();
  }

  const [profile, stops, financials, timeline, vehicle, deliveries] = await Promise.all([
    getCurrentProfile(),
    getTripStops(supabase, trip.id),
    getTripFinancialSummary(supabase, trip),
    getTripTimeline(supabase, trip),
    getVehicleById(supabase, trip.vehicle_id),
    getDeliveriesByTripId(supabase, trip.id),
  ]);

  const recentGpsEvents = await getRecentGpsEvents(supabase, trip.vehicle_id, 10);

  const canManage = profile ? canManageFleet(profile.role) : false;
  const isActiveEnRoute = trip.status === "DISPATCHED" || trip.status === "IN_TRANSIT";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{trip.trip_number}</h1>
            <Badge variant="outline">{TRIP_STATUS_LABEL[trip.status]}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {trip.origin ?? "?"} → {trip.destination ?? "?"}
            {trip.vehicle ? ` · Unit ${trip.vehicle.unit_number}` : ""}
            {trip.driver ? ` · ${trip.driver.full_name}` : " · Unassigned"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {canManage ? <TripStatusActions tripId={trip.id} status={trip.status} /> : null}
          <RaiseDisputeDialog tripId={trip.id} vehicleId={trip.vehicle_id} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="gps">GPS</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="stops">Stops</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewSection trip={trip} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <TimelineSection events={timeline} />
        </TabsContent>
        <TabsContent value="gps" className="mt-4">
          <GpsSection
            destination={trip.destination}
            isActiveEnRoute={isActiveEnRoute}
            latestLocation={vehicle?.vehicle_locations ?? null}
            recentEvents={recentGpsEvents}
          />
        </TabsContent>
        <TabsContent value="financial" className="mt-4">
          <FinancialSection summary={financials} />
        </TabsContent>
        <TabsContent value="stops" className="mt-4">
          <StopsSection stops={stops} />
        </TabsContent>
        <TabsContent value="deliveries" className="mt-4">
          <DeliveriesSection deliveries={deliveries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
