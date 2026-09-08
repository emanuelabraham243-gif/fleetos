import { CalendarClock, ClipboardX, Fuel, PackageSearch, Receipt, ShieldCheck, Siren, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import type { AttentionCategory, AttentionItem } from "@/lib/data/attention";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<AttentionCategory, LucideIcon> = {
  GPS_OFFLINE: Wrench,
  DOCUMENT_EXPIRING: CalendarClock,
  MAINTENANCE_DUE: ShieldCheck,
  EXPENSE_PENDING_REVIEW: Receipt,
  FUEL_REVIEW_RECOMMENDED: Fuel,
  MAINTENANCE_ISSUE_CRITICAL: Siren,
  WORK_ORDER_AWAITING_PARTS: PackageSearch,
  VEHICLE_IN_MAINTENANCE: Wrench,
  INSPECTION_FAILED: ClipboardX,
};

const CATEGORY_LABEL: Record<AttentionCategory, string> = {
  GPS_OFFLINE: "GPS",
  DOCUMENT_EXPIRING: "Document",
  MAINTENANCE_DUE: "Maintenance",
  EXPENSE_PENDING_REVIEW: "Expenses",
  FUEL_REVIEW_RECOMMENDED: "Fuel",
  MAINTENANCE_ISSUE_CRITICAL: "Maintenance",
  WORK_ORDER_AWAITING_PARTS: "Work Order",
  VEHICLE_IN_MAINTENANCE: "Maintenance",
  INSPECTION_FAILED: "Inspection",
};

const severityOrder: Record<AttentionItem["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function AttentionRequired({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          Nothing needs attention right now.
        </CardContent>
      </Card>
    );
  }

  const sorted = [...items].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((item) => {
        const Icon = CATEGORY_ICON[item.category];
        return (
          <Alert key={item.id} variant={item.severity === "critical" ? "destructive" : "default"}>
            <Icon />
            <AlertTitle className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                  item.severity === "critical" && "bg-status-offline/15 text-status-offline",
                  item.severity === "warning" && "bg-status-delayed/15 text-status-delayed",
                  item.severity === "info" && "bg-muted text-muted-foreground",
                )}
              >
                {CATEGORY_LABEL[item.category]}
              </span>
            </AlertTitle>
            <AlertDescription>{item.description}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
