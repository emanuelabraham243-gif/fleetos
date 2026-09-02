import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Honest stand-in for a module that isn't built yet. Deliberately shows no
 * fabricated rows or numbers -- an empty, clearly-labeled state beats a
 * screen that looks finished but isn't backed by anything real.
 */
export function PagePlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        <Badge variant="outline">Planned for a later phase</Badge>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground max-w-sm text-sm">
            This module isn&apos;t built yet. The database schema, RLS
            policies, and navigation route are already in place -- the
            working screen lands in a later phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
