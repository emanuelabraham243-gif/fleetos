import { Activity } from "lucide-react";

import { GpsStatusBadge } from "@/components/gps-status-badge";
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
import { getVehicles } from "@/lib/data/vehicles";
import { formatGpsFreshness } from "@/lib/gps/status";
import { createClient } from "@/lib/supabase/server";

export default async function SystemHealthPage() {
  const supabase = await createClient();
  const [vehicles, connections] = await Promise.all([getVehicles(supabase), getGpsConnectionsList(supabase)]);

  const unhealthyConnections = connections.filter((c) => c.status === "error" || c.status === "disconnected");
  const offlineVehicles = vehicles.filter((v) => {
    const { status } = formatGpsFreshness(v.vehicle_locations?.recorded_at);
    return status === "offline" || status === "unknown";
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          GPS feed connectivity, sync status, and other operational health signals.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">GPS Connections</span>
            <span className="text-2xl font-semibold tabular-nums">{connections.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Unhealthy Connections
            </span>
            <span className="text-2xl font-semibold tabular-nums">{unhealthyConnections.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Vehicles Offline/Unknown
            </span>
            <span className="text-2xl font-semibold tabular-nums">{offlineVehicles.length}</span>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Per-Vehicle GPS Status
        </h3>
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => {
                const { label } = formatGpsFreshness(v.vehicle_locations?.recorded_at);
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">Unit {v.unit_number}</TableCell>
                    <TableCell>
                      <GpsStatusBadge recordedAt={v.vehicle_locations?.recorded_at} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{label}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          GPS Connections
        </h3>
        {connections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Activity className="text-muted-foreground size-8" />
              <p className="text-muted-foreground max-w-sm text-sm">No GPS connections configured.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "destructive"} className="capitalize">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.last_synced_at ? new Date(c.last_synced_at).toLocaleString() : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
