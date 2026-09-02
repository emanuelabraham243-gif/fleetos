import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  Cable,
  ClipboardCheck,
  FileStack,
  FileText,
  Fuel,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Radio,
  Receipt,
  Route,
  ScrollText,
  Settings,
  ShieldAlert,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const COMMAND_CENTER_ITEM: NavItem = {
  label: "Command Center",
  href: "/",
  icon: LayoutDashboard,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Trips", href: "/trips", icon: Route },
      { label: "Dispatch", href: "/dispatch", icon: Radio },
      { label: "Deliveries", href: "/deliveries", icon: Boxes },
    ],
  },
  {
    label: "Fleet",
    items: [
      { label: "Vehicles", href: "/vehicles", icon: Truck },
      { label: "Drivers", href: "/drivers", icon: Users },
      { label: "Maintenance", href: "/maintenance", icon: Wrench },
      { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Revenue", href: "/finance/revenue", icon: Landmark },
      { label: "Expenses", href: "/finance/expenses", icon: Receipt },
      { label: "Fuel", href: "/finance/fuel", icon: Fuel },
      { label: "Payments", href: "/finance/payments", icon: Wallet },
    ],
  },
  {
    label: "Compliance",
    items: [
      { label: "Documents", href: "/compliance/documents", icon: FileText },
      { label: "Contracts", href: "/compliance/contracts", icon: FileStack },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Reports", href: "/intelligence/reports", icon: ScrollText },
      { label: "Analytics", href: "/intelligence/analytics", icon: BarChart3 },
      { label: "Alerts", href: "/intelligence/alerts", icon: Bell },
    ],
  },
  {
    label: "Issues",
    items: [
      { label: "Incidents", href: "/issues/incidents", icon: ShieldAlert },
      { label: "Disputes", href: "/issues/disputes", icon: AlertTriangle },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Integrations", href: "/system/integrations", icon: Cable },
      { label: "Users", href: "/system/users", icon: Users },
      { label: "Audit Log", href: "/system/audit-log", icon: ListChecks },
      { label: "System Health", href: "/system/health", icon: Activity },
      { label: "Settings", href: "/system/settings", icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = [
  COMMAND_CENTER_ITEM,
  ...NAV_GROUPS.flatMap((group) => group.items),
];
