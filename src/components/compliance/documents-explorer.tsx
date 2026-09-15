"use client";

import { FileText } from "lucide-react";
import { useMemo, useState } from "react";

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
import type { FleetDriverDocument, FleetVehicleDocument } from "@/lib/data/documents";
import { computeDocumentStatus, type DocumentStatus } from "@/lib/domain/document";
import { formatDate } from "@/lib/format-time";
import { DOCUMENT_STATUS_LABEL, DRIVER_DOCUMENT_TYPE_LABEL, VEHICLE_DOCUMENT_TYPE_LABEL } from "@/lib/i18n/labels";

const STATUS_BADGE_VARIANT: Record<DocumentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  VALID: "default",
  EXPIRING_SOON: "secondary",
  EXPIRED: "destructive",
  UNKNOWN: "outline",
};

interface Row {
  id: string;
  owner: string;
  ownerType: "Vehicle" | "Driver";
  documentType: string;
  documentNumber: string | null;
  expiresAt: string | null;
  status: DocumentStatus;
  signedUrl: string | null;
}

export function DocumentsExplorer({
  vehicleDocuments,
  driverDocuments,
}: {
  vehicleDocuments: FleetVehicleDocument[];
  driverDocuments: FleetDriverDocument[];
}) {
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const rows: Row[] = useMemo(() => {
    const vRows: Row[] = vehicleDocuments.map((d) => ({
      id: `v-${d.id}`,
      owner: d.vehicle ? `Unit ${d.vehicle.unit_number}` : "Unknown vehicle",
      ownerType: "Vehicle",
      documentType: VEHICLE_DOCUMENT_TYPE_LABEL[d.document_type],
      documentNumber: d.document_number,
      expiresAt: d.expires_at,
      status: computeDocumentStatus(d.expires_at),
      signedUrl: d.signedUrl,
    }));
    const dRows: Row[] = driverDocuments.map((d) => ({
      id: `d-${d.id}`,
      owner: d.driver?.full_name ?? "Unknown driver",
      ownerType: "Driver",
      documentType: DRIVER_DOCUMENT_TYPE_LABEL[d.document_type],
      documentNumber: d.document_number,
      expiresAt: d.expires_at,
      status: computeDocumentStatus(d.expires_at),
      signedUrl: d.signedUrl,
    }));
    return [...vRows, ...dRows].sort((a, b) => {
      const rank: Record<DocumentStatus, number> = { EXPIRED: 0, EXPIRING_SOON: 1, UNKNOWN: 2, VALID: 3 };
      return rank[a.status] - rank[b.status];
    });
  }, [vehicleDocuments, driverDocuments]);

  const filtered = rows.filter((r) => {
    if (ownerTypeFilter && r.ownerType !== ownerTypeFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const expiredCount = rows.filter((r) => r.status === "EXPIRED").length;
  const expiringSoonCount = rows.filter((r) => r.status === "EXPIRING_SOON").length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Total Documents</span>
            <span className="text-2xl font-semibold tabular-nums">{rows.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Expired</span>
            <span className="text-2xl font-semibold tabular-nums">{expiredCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Expiring Soon</span>
            <span className="text-2xl font-semibold tabular-nums">{expiringSoonCount}</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Owner type"
          value={ownerTypeFilter}
          onChange={(e) => setOwnerTypeFilter(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
        >
          <option value="">All owners</option>
          <option value="Vehicle">Vehicles</option>
          <option value="Driver">Drivers</option>
        </select>
        <select
          aria-label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
        >
          <option value="">All statuses</option>
          {(Object.keys(DOCUMENT_STATUS_LABEL) as DocumentStatus[]).map((s) => (
            <option key={s} value={s}>
              {DOCUMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {rows.length === 0 ? "No documents on file." : "No documents match these filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.owner}</TableCell>
                  <TableCell>{r.ownerType}</TableCell>
                  <TableCell className="font-medium">{r.documentType}</TableCell>
                  <TableCell className="text-xs">{r.documentNumber ?? "—"}</TableCell>
                  <TableCell className="text-xs">{r.expiresAt ? formatDate(r.expiresAt) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{DOCUMENT_STATUS_LABEL[r.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.signedUrl ? (
                      <a href={r.signedUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                        View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
