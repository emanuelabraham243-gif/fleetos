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
import { formatDate } from "@/lib/format-time";
import type { VehicleExpense } from "@/lib/data/expenses";
import { computeExpenseDisplayStatus } from "@/lib/domain/expense";
import { formatCurrency } from "@/lib/format-currency";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/i18n/labels";

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

export function ExpensesTab({ expenses }: { expenses: VehicleExpense[] }) {
  if (expenses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No expenses recorded for this vehicle.
        </CardContent>
      </Card>
    );
  }

  const active = expenses.filter((e) => e.status === "active");
  const totalAmount = active.length > 0 ? active.reduce((sum, e) => sum + Number(e.amount), 0) : null;
  const currency = active[0]?.currency ?? expenses[0]?.currency ?? "ETB";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total expenses" value={totalAmount !== null ? formatCurrency(totalAmount, currency) : "No data yet"} />
        <MetricCard label="Recorded" value={String(active.length)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recorded by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-xs">
                  {formatDate(expense.occurred_at)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{EXPENSE_CATEGORY_LABEL[expense.category]}</Badge>
                </TableCell>
                <TableCell>{expense.description ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(Number(expense.amount), expense.currency)}
                </TableCell>
                <TableCell>{expense.vendor_name ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  {computeExpenseDisplayStatus(expense.status, expense.approval_status)}
                </TableCell>
                <TableCell>{expense.recorded_by_profile?.full_name ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
