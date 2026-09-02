import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VehicleIncident } from "@/lib/data/incidents";
import {
  INCIDENT_SEVERITY_LABEL,
  INCIDENT_STATUS_LABEL,
  INCIDENT_TYPE_LABEL,
} from "@/lib/i18n/labels";

const SEVERITY_VARIANT = {
  low: "outline",
  medium: "status-delayed",
  high: "status-delayed",
  critical: "status-offline",
} as const;

export function IncidentsTab({ incidents }: { incidents: VehicleIncident[] }) {
  if (incidents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No incidents recorded for this vehicle.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {incidents.map((incident) => (
        <Card key={incident.id}>
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={SEVERITY_VARIANT[incident.severity]}>
                  {INCIDENT_SEVERITY_LABEL[incident.severity]}
                </Badge>
                <span className="text-sm font-medium">{INCIDENT_TYPE_LABEL[incident.incident_type]}</span>
              </div>
              <Badge variant="outline">{INCIDENT_STATUS_LABEL[incident.status]}</Badge>
            </div>
            <p className="text-sm">{incident.description}</p>
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>{new Date(incident.occurred_at).toLocaleString()}</span>
              {incident.location ? <span>{incident.location}</span> : null}
              {incident.driver ? <span>Driver: {incident.driver.full_name}</span> : null}
              {incident.trip ? <span>Trip: {incident.trip.trip_number}</span> : null}
            </div>
            {incident.evidence.length > 0 ? (
              <div className="mt-1 flex flex-col gap-1 border-t pt-2">
                {incident.evidence.map((item) => (
                  <p key={item.id} className="text-xs">
                    <span className="text-muted-foreground uppercase">[{item.kind}]</span>{" "}
                    {item.content}
                  </p>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
