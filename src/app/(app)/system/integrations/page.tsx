import { Cable } from "lucide-react";

import { SyncGpsButton } from "@/components/command-center/sync-gps-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getGpsConnectionsList } from "@/lib/data/gps-connections";
import { formatFullDateTime } from "@/lib/format-time";
import { GPS_CONNECTION_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type GpsConnectionStatus = Database["public"]["Enums"]["gps_connection_status"];

const STATUS_BADGE_VARIANT: Record<GpsConnectionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "secondary",
  error: "destructive",
  disconnected: "outline",
};

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const connections = await getGpsConnectionsList(supabase);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            GPS provider connections and other external integrations.
          </p>
        </div>
        <SyncGpsButton />
      </div>

      {connections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Cable className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">No integrations configured.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connection</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((c) => {
                const activeDevices = c.vehicle_devices.filter((d) => d.is_active).length;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.gps_provider?.name ?? "—"}</TableCell>
                    <TableCell>{activeDevices}</TableCell>
                    <TableCell className="text-xs">
                      {c.last_synced_at ? formatFullDateTime(c.last_synced_at) : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[c.status]}>{GPS_CONNECTION_STATUS_LABEL[c.status]}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
