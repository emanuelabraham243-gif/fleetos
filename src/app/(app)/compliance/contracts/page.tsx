import { FileStack } from "lucide-react";

import { ContractStatusDialog } from "@/components/compliance/contract-status-dialog";
import { CreateContractDialog } from "@/components/compliance/create-contract-dialog";
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
import { getClients } from "@/lib/data/clients";
import { getContractsList } from "@/lib/data/contracts";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-time";
import { CONTRACT_RATE_TYPE_LABEL, CONTRACT_STATUS_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  active: "default",
  expired: "secondary",
  terminated: "destructive",
};

export default async function ContractsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [contracts, clients] = await Promise.all([getContractsList(supabase), getClients(supabase)]);
  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Client contracts, rates, and their supporting documents.
          </p>
        </div>
        {canManage ? <CreateContractDialog clients={clients.map((c) => ({ id: c.id, name: c.name }))} /> : null}
      </div>

      {contracts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileStack className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">No contracts recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead className="w-32" aria-label="Actions" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contract_number}</TableCell>
                  <TableCell>{contract.client.name}</TableCell>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>
                    {CONTRACT_RATE_TYPE_LABEL[contract.rate_type]}
                    {contract.rate_amount !== null ? ` -- ${formatCurrency(Number(contract.rate_amount), "ETB")}` : ""}
                  </TableCell>
                  <TableCell className="text-xs">
                    {contract.start_date ? formatDate(contract.start_date) : "—"}
                    {" -> "}
                    {contract.end_date ? formatDate(contract.end_date) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[contract.status]}>
                      {CONTRACT_STATUS_LABEL[contract.status]}
                    </Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <ContractStatusDialog contractId={contract.id} status={contract.status} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
