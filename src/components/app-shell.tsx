"use client";

import { Bell, ChevronsLeft, ChevronsRight, Menu, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AppSidebarNav } from "@/components/app-sidebar-nav";
import { QUICK_ACTIONS } from "@/components/command-center/quick-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ALL_NAV_ITEMS } from "@/lib/nav";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "fleetos:sidebar-collapsed";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function usePageTitle(): string {
  const pathname = usePathname();
  return useMemo(() => {
    const match = ALL_NAV_ITEMS.filter(
      (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
    ).sort((a, b) => b.href.length - a.href.length)[0];
    return match?.label ?? "FleetOS";
  }, [pathname]);
}

export function AppShell({
  organizationName,
  fullName,
  role,
  unreadNotificationCount,
  onSignOut,
  children,
}: {
  organizationName: string;
  fullName: string;
  role: string;
  unreadNotificationCount: number;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pageTitle = usePageTitle();

  useEffect(() => {
    // Deliberately synced from localStorage after mount rather than in a
    // lazy useState initializer: the server has no localStorage, so
    // reading it during render would mismatch the server-rendered HTML.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (private mode, etc) -- stay expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-svh">
      <aside
        className={cnAsideWidth(collapsed)}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!collapsed && (
            <span className="text-sm font-semibold tracking-widest uppercase">FleetOS</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <AppSidebarNav collapsed={collapsed} />
        </ScrollArea>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="text-sm font-semibold tracking-widest uppercase">
              FleetOS
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <AppSidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-5" />
            <span className="sr-only">Open navigation</span>
          </Button>

          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{pageTitle}</span>
            <span className="text-muted-foreground truncate text-xs">{organizationName}</span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Quick actions">
                  <Plus className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {QUICK_ACTIONS.map((action) => (
                  <DropdownMenuItem key={action.href} asChild>
                    <Link href={action.href}>
                      <action.icon />
                      {action.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="size-4" />
                  {unreadNotificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                    >
                      {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                  {unreadNotificationCount > 0
                    ? `${unreadNotificationCount} unread`
                    : "No new notifications"}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="size-7">
                    <AvatarFallback>{initials(fullName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <span className="flex flex-col">
                    <span className="font-medium">{fullName}</span>
                    <span className="text-muted-foreground text-xs font-normal capitalize">
                      {role}
                    </span>
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void onSignOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex flex-1 flex-col p-6">{children}</main>
      </div>
    </div>
  );
}

function cnAsideWidth(collapsed: boolean): string {
  return [
    "bg-card hidden shrink-0 border-r transition-[width] duration-150 lg:flex lg:flex-col",
    collapsed ? "lg:w-16" : "lg:w-64",
  ].join(" ");
}
