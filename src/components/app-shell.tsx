"use client";

import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AppSidebarNav } from "@/components/app-sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  organizationName,
  fullName,
  role,
  onSignOut,
  children,
}: {
  organizationName: string;
  fullName: string;
  role: string;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh">
      <aside className="bg-card hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-sm font-semibold tracking-widest uppercase">
            FleetOS
          </span>
        </div>
        <ScrollArea className="flex-1">
          <AppSidebarNav />
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

          <span className="text-muted-foreground truncate text-sm font-medium">
            {organizationName}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="size-7">
                    <AvatarFallback>{initials(fullName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {fullName}
                  </span>
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
                <DropdownMenuItem onSelect={() => void onSignOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex flex-1 flex-col p-6">{children}</main>
      </div>
    </div>
  );
}
