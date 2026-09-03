import { FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Attachment } from "@/lib/data/attachments";
import { formatDateTime } from "@/lib/format-time";

export function EvidenceList({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          No evidence attached yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center gap-3 text-sm">
            <FileText className="text-muted-foreground size-4 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium">{attachment.file_name}</span>
              <span className="text-muted-foreground text-xs">
                {formatDateTime(attachment.created_at)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
