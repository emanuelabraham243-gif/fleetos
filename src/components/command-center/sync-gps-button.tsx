"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

/**
 * Runs one mock-GPS pull cycle (POST /api/gps/sync, built in Phase 1) and
 * refreshes the page so newly-ingested positions show up immediately --
 * without this, the demo feed only ever advances when something else
 * happens to call that route.
 */
export function SyncGpsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    try {
      const response = await fetch("/api/gps/sync", { method: "POST" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      startTransition(() => router.refresh());
    } catch {
      setError("GPS sync failed. Please try again.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
        <RefreshCw className={pending ? "animate-spin" : undefined} />
        {pending ? "Syncing…" : "Sync GPS"}
      </Button>
      {error ? <span className="text-destructive text-xs">{error}</span> : null}
    </div>
  );
}
