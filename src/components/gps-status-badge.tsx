import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { computeGpsStatus, formatGpsFreshness, GPS_STATUS_LABEL } from "@/lib/gps/status";

export function GpsStatusBadge({ recordedAt }: { recordedAt: string | null | undefined }) {
  const status = computeGpsStatus(recordedAt);

  return (
    <Badge variant={`status-${status}` as const}>{GPS_STATUS_LABEL[status]}</Badge>
  );
}

/** Badge + the "Updated 2 minutes ago" / "Last signal 47 minutes ago" sentence beneath it. */
export function GpsStatusWithFreshness({
  recordedAt,
  className,
}: {
  recordedAt: string | null | undefined;
  className?: string;
}) {
  const { status, label } = formatGpsFreshness(recordedAt);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Badge variant={`status-${status}` as const} className="w-fit">
        {GPS_STATUS_LABEL[status]}
      </Badge>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
