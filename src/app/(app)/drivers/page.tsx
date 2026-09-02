import { Users } from "lucide-react";

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
import { getDrivers } from "@/lib/data/drivers";
import { createClient } from "@/lib/supabase/server";

export default async function DriversPage() {
  const supabase = await createClient();
  const drivers = await getDrivers(supabase);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {drivers.length} driver{drivers.length === 1 ? "" : "s"} on the roster.
        </p>
      </div>

      {drivers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              No drivers yet. Add the first driver to the roster to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hired</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.full_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{driver.email ?? "—"}</span>
                      <span className="text-muted-foreground">{driver.phone ?? ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {driver.license_number
                      ? `${driver.license_number}${driver.license_class ? ` (${driver.license_class})` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{driver.hire_date ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
