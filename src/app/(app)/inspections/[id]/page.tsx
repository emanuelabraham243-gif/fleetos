import { notFound } from "next/navigation";
import Link from "next/link";

import { CreateIssueFromItemButton } from "@/components/inspections/create-issue-from-item-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAttachmentsWithUrls } from "@/lib/data/attachments";
import { getInspectionById } from "@/lib/data/inspections";
import {
  INSPECTION_ITEM_RESULT_LABEL,
  INSPECTION_OVERALL_RESULT_LABEL,
  INSPECTION_TYPE_LABEL,
  MAINTENANCE_ISSUE_SEVERITY_LABEL,
} from "@/lib/i18n/labels";
import { formatFullDateTime } from "@/lib/format-time";
import { createClient } from "@/lib/supabase/server";

const RESULT_BADGE_VARIANT: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  PASS: "default",
  FAIL: "destructive",
  NOT_APPLICABLE: "outline",
  UNKNOWN: "secondary",
};

const OVERALL_BADGE_VARIANT: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  PASSED: "default",
  FAILED: "destructive",
  PARTIAL: "secondary",
  UNKNOWN: "outline",
};

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const inspection = await getInspectionById(supabase, id);
  if (!inspection) {
    notFound();
  }

  const attachments = await getAttachmentsWithUrls(supabase, "inspection", id);

  const grouped = new Map<string, typeof inspection.items>();
  for (const item of inspection.items) {
    const list = grouped.get(item.category);
    if (list) list.push(item);
    else grouped.set(item.category, [item]);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{INSPECTION_TYPE_LABEL[inspection.inspection_type]} Inspection</h1>
          <Badge variant={OVERALL_BADGE_VARIANT[inspection.overall_result]}>
            {INSPECTION_OVERALL_RESULT_LABEL[inspection.overall_result]}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {inspection.vehicle ? (
            <Link href={`/vehicles/${inspection.vehicle.id}`} className="hover:underline">
              Unit {inspection.vehicle.unit_number}
            </Link>
          ) : (
            "Unassigned vehicle"
          )}{" "}
          · {formatFullDateTime(inspection.performed_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">{category}</h3>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-start justify-between gap-3 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.item_name}</span>
                          <Badge variant={RESULT_BADGE_VARIANT[item.result]}>
                            {INSPECTION_ITEM_RESULT_LABEL[item.result]}
                          </Badge>
                          {item.severity ? (
                            <Badge variant="outline" className="capitalize">
                              {MAINTENANCE_ISSUE_SEVERITY_LABEL[item.severity]}
                            </Badge>
                          ) : null}
                        </div>
                        {item.note ? <p className="text-muted-foreground mt-1 text-sm">&quot;{item.note}&quot;</p> : null}
                      </div>
                      {item.result === "FAIL" ? (
                        item.created_issue_id ? (
                          <Link
                            href={`/maintenance/issues/${item.created_issue_id}`}
                            className="text-primary text-xs whitespace-nowrap hover:underline"
                          >
                            View Issue
                          </Link>
                        ) : (
                          <CreateIssueFromItemButton
                            itemId={item.id}
                            inspectionId={inspection.id}
                            vehicleId={inspection.vehicle_id}
                            category={item.category}
                            itemName={item.item_name}
                            note={item.note}
                            severity={item.severity}
                          />
                        )
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {attachments.length > 0 ? (
            <div>
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                Attachments
              </h3>
              <div className="flex flex-col gap-1">
                {attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.signedUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border p-2 text-sm hover:bg-accent/50"
                  >
                    {a.file_name}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <Card>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Driver</span>
            <span>{inspection.driver?.full_name ?? "—"}</span>
            <span className="text-muted-foreground">Inspector</span>
            <span>{inspection.inspector?.full_name ?? "—"}</span>
            <span className="text-muted-foreground">Mileage</span>
            <span>
              {inspection.odometer_km !== null ? `${Number(inspection.odometer_km).toLocaleString()} km` : "Unknown"}
            </span>
            {inspection.findings ? (
              <>
                <span className="text-muted-foreground">Notes</span>
                <span>{inspection.findings}</span>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
