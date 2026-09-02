"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { COMMAND_CENTER_ITEM, NAV_GROUPS } from "@/lib/nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4 px-3 py-4">
      <Link
        href={COMMAND_CENTER_ITEM.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive(pathname, COMMAND_CENTER_ITEM.href)
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <COMMAND_CENTER_ITEM.icon className="size-4" />
        {COMMAND_CENTER_ITEM.label}
      </Link>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="text-muted-foreground px-3 text-xs font-semibold tracking-widest uppercase">
            {group.label}
          </span>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(pathname, item.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
