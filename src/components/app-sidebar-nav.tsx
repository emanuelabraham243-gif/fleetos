"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { COMMAND_CENTER_ITEM, NAV_GROUPS, type NavItem } from "@/lib/nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
  emphasized,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  emphasized?: boolean;
}) {
  const Icon: LucideIcon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md text-sm transition-colors",
        collapsed ? "justify-center px-2 py-2" : "px-3 py-1.5",
        emphasized && "font-medium",
        active
          ? emphasized
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        emphasized && !active && "text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && item.label}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4 px-3 py-4">
      <NavLink
        item={COMMAND_CENTER_ITEM}
        active={isActive(pathname, COMMAND_CENTER_ITEM.href)}
        collapsed={collapsed}
        onNavigate={onNavigate}
        emphasized
      />

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!collapsed && (
            <span className="text-muted-foreground px-3 text-xs font-semibold tracking-widest uppercase">
              {group.label}
            </span>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
