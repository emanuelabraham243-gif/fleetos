"use client";

import { ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLogEntry } from "@/lib/data/audit";
import { DATE_RANGE_PRESET_LABEL, type DateRangePreset } from "@/lib/domain/date-range";
import { formatFullDateTime } from "@/lib/format-time";

const PRESETS: DateRangePreset[] = ["today", "this_week", "this_month", "last_month"];

const ACTION_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  insert: "default",
  update: "secondary",
  delete: "destructive",
};

function changedFields(entry: AuditLogEntry): string[] {
  if (entry.action !== "update") return [];
  const prev = (entry.previous_value ?? {}) as Record<string, unknown>;
  const next = (entry.new_value ?? {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  return Array.from(keys).filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(next[k]));
}

export function AuditLogExplorer({
  entries,
  tableNames,
  preset,
  tableNameFilter,
}: {
  entries: AuditLogEntry[];
  tableNames: string[];
  preset: DateRangePreset;
  tableNameFilter: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((e) => e.record_id.toLowerCase().includes(query) || (e.reason ?? "").toLowerCase().includes(query));
  }, [entries, search]);

  function buildUrl(range: DateRangePreset, table: string, start?: string, end?: string) {
    const params = new URLSearchParams();
    params.set("range", range);
    if (table) params.set("table", table);
    if (range === "custom" && start && end) {
      params.set("start", start);
      params.set("end", end);
    }
    return `/system/audit-log?${params.toString()}`;
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => router.push(buildUrl(p, tableNameFilter))}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              preset === p ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent/50"
            }`}
          >
            {DATE_RANGE_PRESET_LABEL[p]}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9 w-36" aria-label="Custom range start" />
          <span className="text-muted-foreground text-xs">to</span>
          <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9 w-36" aria-label="Custom range end" />
          <button
            type="button"
            onClick={() => customStart && customEnd && router.push(buildUrl("custom", tableNameFilter, customStart, customEnd))}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              preset === "custom" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent/50"
            }`}
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Table"
          value={tableNameFilter}
          onChange={(e) => router.push(buildUrl(preset, e.target.value))}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
        >
          <option value="">All tables</option>
          {tableNames.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search record ID or reason…"
          className="h-9 max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ListChecks className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {entries.length === 0 ? "No audit events in this range." : "No events match these filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Changed Fields</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">{formatFullDateTime(entry.created_at)}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.table_name}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_BADGE_VARIANT[entry.action] ?? "outline"} className="capitalize">
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate font-mono text-xs">{entry.record_id}</TableCell>
                  <TableCell>{entry.actor?.full_name ?? "System"}</TableCell>
                  <TableCell className="text-xs">
                    {entry.action === "update" ? changedFields(entry).join(", ") || "—" : "—"}
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
