import type { LucideIcon } from "lucide-react";
import { Activity, Navigation, Truck, Wrench, WifiOff, Route as RouteIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { FleetSummary } from "@/lib/data/fleet";
import { cn } from "@/lib/utils";

interface SummaryCardDef {
  label: string;
  value: number;
  icon: LucideIcon;
  context: string;
  accentClassName?: string;
}

function SummaryCard({ label, value, icon: Icon, context, accentClassName }: SummaryCardDef) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </span>
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          <span className="text-muted-foreground text-xs">{context}</span>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md bg-muted",
            accentClassName,
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FleetSummaryCards({ summary }: { summary: FleetSummary }) {
  const cards: SummaryCardDef[] = [
    {
      label: "Total Vehicles",
      value: summary.total,
      icon: Truck,
      context: "In the fleet",
    },
    {
      label: "On Trip",
      value: summary.onTrip,
      icon: RouteIcon,
      context: summary.onTrip === 1 ? "Vehicle dispatched" : "Vehicles dispatched",
      accentClassName: "bg-status-live/15 text-status-live",
    },
    {
      label: "Available",
      value: summary.available,
      icon: Navigation,
      context: "Ready to dispatch",
    },
    {
      label: "Maintenance",
      value: summary.maintenance,
      icon: Wrench,
      context: "Out of service",
      accentClassName: "bg-status-delayed/15 text-status-delayed",
    },
    {
      label: "Offline",
      value: summary.offline,
      icon: WifiOff,
      context: "No recent GPS signal",
      accentClassName: summary.offline > 0 ? "bg-status-offline/15 text-status-offline" : undefined,
    },
    {
      label: "Active Trips",
      value: summary.activeTrips,
      icon: Activity,
      context: summary.activeTrips === 1 ? "Trip in progress" : "Trips in progress",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}
