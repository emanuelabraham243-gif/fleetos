import { Badge } from "@/components/ui/badge";
import { computeGpsStatus, GPS_STATUS_LABEL } from "@/lib/gps/status";

export function GpsStatusBadge({ recordedAt }: { recordedAt: string | null | undefined }) {
  const status = computeGpsStatus(recordedAt);

  return (
    <Badge variant={`status-${status}` as const}>{GPS_STATUS_LABEL[status]}</Badge>
  );
}
