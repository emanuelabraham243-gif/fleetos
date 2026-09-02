import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VehicleDocument } from "@/lib/data/vehicle-documents";
import { computeDocumentStatus } from "@/lib/domain/document";
import { DOCUMENT_STATUS_LABEL, VEHICLE_DOCUMENT_TYPE_LABEL } from "@/lib/i18n/labels";

const STATUS_VARIANT = {
  VALID: "status-live",
  EXPIRING_SOON: "status-delayed",
  EXPIRED: "status-offline",
  UNKNOWN: "status-unknown",
} as const;

export function DocumentsTab({ documents }: { documents: VehicleDocument[] }) {
  if (documents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No documents on file for this vehicle.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Document Number</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attachment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const status = computeDocumentStatus(doc.expires_at);
            return (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  {VEHICLE_DOCUMENT_TYPE_LABEL[doc.document_type]}
                </TableCell>
                <TableCell className="text-xs">{doc.document_number ?? "—"}</TableCell>
                <TableCell className="text-xs">{doc.issued_at ?? "—"}</TableCell>
                <TableCell className="text-xs">{doc.expires_at ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[status]}>{DOCUMENT_STATUS_LABEL[status]}</Badge>
                </TableCell>
                <TableCell>
                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
