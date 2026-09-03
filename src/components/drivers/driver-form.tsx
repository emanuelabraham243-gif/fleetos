"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DRIVER_STATUSES } from "@/lib/domain/driver";
import { DRIVER_STATUS_LABEL } from "@/lib/i18n/labels";

export interface DriverFormValues {
  full_name: string;
  phone: string;
  email: string;
  employee_id: string;
  license_number: string;
  license_class: string;
  license_issued_at: string;
  license_expiry: string;
  hire_date: string;
  status: string;
  notes: string;
}

const EMPTY_VALUES: DriverFormValues = {
  full_name: "",
  phone: "",
  email: "",
  employee_id: "",
  license_number: "",
  license_class: "",
  license_issued_at: "",
  license_expiry: "",
  hire_date: "",
  status: "ACTIVE",
  notes: "",
};

type FormState = { error: string } | null;

export function DriverForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<DriverFormValues>;
  submitLabel: string;
}) {
  const values = { ...EMPTY_VALUES, ...defaultValues };
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="full_name">Full name *</Label>
          <Input id="full_name" name="full_name" defaultValue={values.full_name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={values.phone} placeholder="+251 9XX XXX XXX" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={values.email} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="employee_id">Employee / reference ID</Label>
          <Input id="employee_id" name="employee_id" defaultValue={values.employee_id} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="license_number">License number</Label>
          <Input id="license_number" name="license_number" defaultValue={values.license_number} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="license_class">License class</Label>
          <Input id="license_class" name="license_class" defaultValue={values.license_class} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="license_issued_at">License issue date</Label>
          <Input id="license_issued_at" name="license_issued_at" type="date" defaultValue={values.license_issued_at} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="license_expiry">License expiry date</Label>
          <Input id="license_expiry" name="license_expiry" type="date" defaultValue={values.license_expiry} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="hire_date">Hire / join date</Label>
          <Input id="hire_date" name="hire_date" type="date" defaultValue={values.hire_date} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {DRIVER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {DRIVER_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={values.notes}
          rows={3}
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
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
