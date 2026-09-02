import { Fuel, Plus, Receipt, ShieldAlert, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const QUICK_ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "New Trip", href: "/trips/new", icon: Plus },
  { label: "Record Fuel", href: "/finance/fuel/new", icon: Fuel },
  { label: "Add Expense", href: "/finance/expenses/new", icon: Receipt },
  { label: "Report Issue", href: "/issues/incidents/new", icon: ShieldAlert },
  { label: "Add Vehicle", href: "/vehicles/new", icon: Truck },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_ACTIONS.map((action) => (
        <Button key={action.href} variant="outline" size="sm" asChild>
          <Link href={action.href}>
            <action.icon />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

export { QUICK_ACTIONS };
