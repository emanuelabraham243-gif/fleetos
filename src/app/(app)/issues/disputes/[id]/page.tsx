import { notFound } from "next/navigation";
import Link from "next/link";

import { DisputeStatusDialog } from "@/components/disputes/dispute-status-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getDisputeById } from "@/lib/data/disputes";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { formatDate } from "@/lib/format-time";
import { DISPUTE_STATUS_LABEL, DISPUTE_TYPE_LABEL, INCIDENT_TYPE_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const dispute = await getDisputeById(supabase, id);
  if (!dispute) notFound();

  const profile = await getCurrentProfile();
  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{DISPUTE_TYPE_LABEL[dispute.dispute_type]}</h1>
          <Badge variant="outline">{DISPUTE_STATUS_LABEL[dispute.status]}</Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">Opened {formatDate(dispute.opened_at)}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-2 py-4">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Description</span>
              <p className="text-sm whitespace-pre-wrap">{dispute.description}</p>
            </CardContent>
          </Card>

          {dispute.driver_response ? (
            <Card>
              <CardContent className="flex flex-col gap-2 py-4">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Driver Response
                </span>
                <p className="text-sm whitespace-pre-wrap">{dispute.driver_response}</p>
              </CardContent>
            </Card>
          ) : null}

          {dispute.resolution ? (
            <Card>
              <CardContent className="flex flex-col gap-2 py-4">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Resolution</span>
                <p className="text-sm whitespace-pre-wrap">{dispute.resolution}</p>
                {dispute.resolved_at ? (
                  <span className="text-muted-foreground text-xs">Resolved {formatDate(dispute.resolved_at)}</span>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Client</span>
            <span>{dispute.client?.name ?? "—"}</span>
            <span className="text-muted-foreground">Trip</span>
            <span>
              {dispute.trip ? (
                <Link href={`/trips/${dispute.trip.id}`} className="hover:underline">
                  {dispute.trip.trip_number}
                </Link>
              ) : (
                "—"
              )}
            </span>
            <span className="text-muted-foreground">Delivery</span>
            <span>
              {dispute.delivery ? (
                <Link href={`/deliveries/${dispute.delivery.id}`} className="hover:underline">
                  {dispute.delivery.delivery_number}
                </Link>
              ) : (
                "—"
              )}
            </span>
            <span className="text-muted-foreground">Vehicle</span>
            <span>
              {dispute.vehicle ? (
                <Link href={`/vehicles/${dispute.vehicle.id}`} className="hover:underline">
                  Unit {dispute.vehicle.unit_number}
                </Link>
              ) : (
                "—"
              )}
            </span>
            <span className="text-muted-foreground">Driver</span>
            <span>
              {dispute.driver ? (
                <Link href={`/drivers/${dispute.driver.id}`} className="hover:underline">
                  {dispute.driver.full_name}
                </Link>
              ) : (
                "—"
              )}
            </span>
            <span className="text-muted-foreground">Incident</span>
            <span>
              {dispute.incident ? (
                <Link href={`/issues/incidents/${dispute.incident.id}`} className="hover:underline">
                  {INCIDENT_TYPE_LABEL[dispute.incident.incident_type]}
                </Link>
              ) : (
                "—"
              )}
            </span>
          </CardContent>
          {canManage ? (
            <CardContent className="pt-0">
              <DisputeStatusDialog disputeId={dispute.id} status={dispute.status} />
            </CardContent>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
