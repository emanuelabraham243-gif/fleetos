"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CHECKLISTS, type InspectionItemResult, type InspectionType } from "@/lib/domain/inspection";
import { INSPECTION_ITEM_RESULT_LABEL, INSPECTION_TYPE_LABEL, MAINTENANCE_ISSUE_SEVERITY_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type FormState = { error: string } | null;

interface ChecklistItemState {
  category: string;
  itemName: string;
  result: InspectionItemResult;
  note: string;
  severity: Database["public"]["Enums"]["maintenance_issue_severity"];
}

const RESULTS: InspectionItemResult[] = ["PASS", "FAIL", "NOT_APPLICABLE", "UNKNOWN"];
const INSPECTION_TYPES = Object.keys(INSPECTION_TYPE_LABEL) as InspectionType[];
const SEVERITIES = Object.keys(MAINTENANCE_ISSUE_SEVERITY_LABEL) as Database["public"]["Enums"]["maintenance_issue_severity"][];

function buildInitialItems(type: InspectionType): ChecklistItemState[] {
  return DEFAULT_CHECKLISTS[type].flatMap((group) =>
    group.items.map((itemName) => ({
      category: group.category,
      itemName,
      result: "UNKNOWN" as InspectionItemResult,
      note: "",
      severity: "medium" as const,
    })),
  );
}

export function InspectionForm({
  action,
  vehicles,
  drivers,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles: { id: string; unitNumber: string }[];
  drivers: { id: string; fullName: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [inspectionType, setInspectionType] = useState<InspectionType>("pre_trip");
  const [items, setItems] = useState<ChecklistItemState[]>(() => buildInitialItems("pre_trip"));

  const grouped = useMemo(() => {
    const byCategory = new Map<string, { item: ChecklistItemState; index: number }[]>();
    items.forEach((item, index) => {
      const list = byCategory.get(item.category);
      if (list) list.push({ item, index });
      else byCategory.set(item.category, [{ item, index }]);
    });
    return Array.from(byCategory.entries());
  }, [items]);

  function changeType(type: InspectionType) {
    setInspectionType(type);
    setItems(buildInitialItems(type));
  }

  function updateItem(index: number, patch: Partial<ChecklistItemState>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  const itemsJson = JSON.stringify(
    items.map((i) => ({ category: i.category, itemName: i.itemName, result: i.result, note: i.note || null, severity: i.severity })),
  );

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <input type="hidden" name="items_json" value={itemsJson} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicle_id">Vehicle *</Label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            defaultValue=""
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="" disabled>
              Select a vehicle
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                Unit {v.unitNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="inspection_type">Inspection type *</Label>
          <select
            id="inspection_type"
            name="inspection_type"
            value={inspectionType}
            onChange={(e) => changeType(e.target.value as InspectionType)}
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {INSPECTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {INSPECTION_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="performed_at">Date/time *</Label>
          <Input id="performed_at" name="performed_at" type="datetime-local" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="driver_id">Driver</Label>
          <select
            id="driver_id"
            name="driver_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Not specified</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="odometer_km">Mileage (km, if known)</Label>
          <Input id="odometer_km" name="odometer_km" type="number" min={0} step="0.1" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {grouped.map(([category, categoryItems]) => (
          <div key={category} className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{category}</h3>
            <div className="flex flex-col gap-2">
              {categoryItems.map(({ item, index }) => (
                <div key={index} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{item.itemName}</span>
                    <div className="flex gap-1">
                      {RESULTS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateItem(index, { result: r })}
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs transition-colors",
                            item.result === r
                              ? r === "FAIL"
                                ? "bg-destructive text-destructive-foreground border-destructive"
                                : "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-accent/50",
                          )}
                        >
                          {INSPECTION_ITEM_RESULT_LABEL[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {item.result === "FAIL" ? (
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <textarea
                        value={item.note}
                        onChange={(e) => updateItem(index, { note: e.target.value })}
                        placeholder="What was observed"
                        rows={1}
                        className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm shadow-xs"
                      />
                      <select
                        value={item.severity}
                        onChange={(e) =>
                          updateItem(index, { severity: e.target.value as ChecklistItemState["severity"] })
                        }
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>
                            {MAINTENANCE_ISSUE_SEVERITY_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : item.result === "UNKNOWN" ? (
                    <textarea
                      value={item.note}
                      onChange={(e) => updateItem(index, { note: e.target.value })}
                      placeholder="Why this couldn't be checked (optional)"
                      rows={1}
                      className="border-input bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm shadow-xs"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Inspection"}
        </Button>
      </div>
    </form>
  );
}
