import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Card className="max-w-md border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <SearchX className="text-muted-foreground size-8" />
          <p className="font-medium">Not found.</p>
          <p className="text-muted-foreground text-sm">
            That record doesn&apos;t exist, or you don&apos;t have access to it.
          </p>
          <Button asChild className="mt-2">
            <Link href="/">Back to Command Center</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
