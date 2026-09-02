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
import type { VehicleExpense } from "@/lib/data/expenses";
import { formatCurrency } from "@/lib/format-currency";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/i18n/labels";

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

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Recorded by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="text-xs">
                {new Date(expense.occurred_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{EXPENSE_CATEGORY_LABEL[expense.category]}</Badge>
              </TableCell>
              <TableCell>{expense.description ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(Number(expense.amount), expense.currency)}
                {expense.status !== "active" ? (
                  <span className="text-muted-foreground ml-1 text-xs">({expense.status})</span>
                ) : null}
              </TableCell>
              <TableCell>{expense.vendor_name ?? "—"}</TableCell>
              <TableCell>{expense.recorded_by_profile?.full_name ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
