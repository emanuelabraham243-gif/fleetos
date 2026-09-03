import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DriverIncident } from "@/lib/data/incidents";
import { formatFullDateTime } from "@/lib/format-time";
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

export function DriverIncidentsTab({ incidents }: { incidents: DriverIncident[] }) {
  if (incidents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No incidents recorded for this driver.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {incidents.map((incident) => (
          <div key={incident.id} className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between">
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
              <span>{formatFullDateTime(incident.occurred_at)}</span>
              {incident.location ? <span>{incident.location}</span> : null}
              {incident.vehicle ? <span>Unit {incident.vehicle.unit_number}</span> : null}
              {incident.trip ? <span>Trip: {incident.trip.trip_number}</span> : null}
            </div>
            {incident.evidence.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                {incident.evidence.length} piece{incident.evidence.length === 1 ? "" : "s"} of evidence on
                file.
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
