import { notFound } from "next/navigation";
import Link from "next/link";

import { AddEvidenceDialog } from "@/components/incidents/add-evidence-dialog";
import { IncidentStatusDialog } from "@/components/incidents/incident-status-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getIncidentById } from "@/lib/data/incidents";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { formatFullDateTime } from "@/lib/format-time";
import {
  EVIDENCE_KIND_LABEL,
  EVIDENCE_SOURCE_LABEL,
  INCIDENT_SEVERITY_LABEL,
  INCIDENT_STATUS_LABEL,
  INCIDENT_TYPE_LABEL,
} from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const incident = await getIncidentById(supabase, id);
  if (!incident) notFound();

  const profile = await getCurrentProfile();
  const canManage = profile ? canManageFleet(profile.role) : false;

  const evidenceWithUrls = await Promise.all(
    incident.evidence.map(async (e) => {
      if (!e.file_url) return { ...e, signedUrl: null };
      const { data } = await supabase.storage.from("attachments").createSignedUrl(e.file_url, SIGNED_URL_TTL_SECONDS);
      return { ...e, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{INCIDENT_TYPE_LABEL[incident.incident_type]}</h1>
          <Badge variant="outline" className="capitalize">
            {INCIDENT_SEVERITY_LABEL[incident.severity]}
          </Badge>
          <Badge variant="outline">{INCIDENT_STATUS_LABEL[incident.status]}</Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatFullDateTime(incident.occurred_at)}
          {incident.location ? ` -- ${incident.location}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-2 py-4">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Description</span>
              <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
            </CardContent>
          </Card>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Evidence</h3>
              {canManage ? <AddEvidenceDialog incidentId={incident.id} /> : null}
            </div>
            {evidenceWithUrls.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  No evidence recorded yet.
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {evidenceWithUrls.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="flex flex-col gap-1 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{EVIDENCE_KIND_LABEL[e.kind]}</Badge>
                        <Badge variant="secondary">{EVIDENCE_SOURCE_LABEL[e.source]}</Badge>
                        <span className="text-muted-foreground text-xs">{formatFullDateTime(e.recorded_at)}</span>
                      </div>
                      <p className="text-sm">{e.content}</p>
                      {e.signedUrl ? (
                        <a
                          href={e.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-xs underline underline-offset-4"
                        >
                          View attachment
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Vehicle</span>
            <span>
              {incident.vehicle ? (
                <Link href={`/vehicles/${incident.vehicle.id}`} className="hover:underline">
                  Unit {incident.vehicle.unit_number}
                </Link>
              ) : (
                "—"
              )}
            </span>
            <span className="text-muted-foreground">Driver</span>
            <span>
              {incident.driver ? (
                <Link href={`/drivers/${incident.driver.id}`} className="hover:underline">
                  {incident.driver.full_name}
                </Link>
              ) : (
                "—"
              )}
            </span>
            <span className="text-muted-foreground">Trip</span>
            <span>
              {incident.trip ? (
                <Link href={`/trips/${incident.trip.id}`} className="hover:underline">
                  {incident.trip.trip_number}
                </Link>
              ) : (
                "—"
              )}
            </span>
            <span className="text-muted-foreground">Reported by</span>
            <span>{incident.reported_by_profile?.full_name ?? "—"}</span>
            <span className="text-muted-foreground">Reported at</span>
            <span>{formatFullDateTime(incident.reported_at)}</span>
          </CardContent>
          {canManage ? (
            <CardContent className="pt-0">
              <IncidentStatusDialog incidentId={incident.id} status={incident.status} />
            </CardContent>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
