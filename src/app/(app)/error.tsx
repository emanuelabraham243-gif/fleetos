"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Card className="max-w-md border-destructive/30">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="text-destructive size-8" />
          <p className="font-medium">Unable to load fleet data.</p>
          <p className="text-muted-foreground text-sm">
            Please try again. If this keeps happening, check that Supabase is reachable.
          </p>
          <Button onClick={reset} className="mt-2">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
