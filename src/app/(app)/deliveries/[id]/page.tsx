import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { RaiseDisputeDialog } from "@/components/disputes/raise-dispute-dialog";
import { DELIVERY_STATUS_BADGE_VARIANT } from "@/components/deliveries/deliveries-explorer";
import { DeliveryConfirmationDialog } from "@/components/deliveries/delivery-confirmation-dialog";
import { DeliveryOverview } from "@/components/deliveries/delivery-overview";
import { DeliveryStatusActions } from "@/components/deliveries/delivery-status-actions";
import { EvidenceList } from "@/components/deliveries/evidence-list";
import { getAttachmentsByEntity } from "@/lib/data/attachments";
import { getCurrentProfile } from "@/lib/data/profile";
import { getDeliveryById } from "@/lib/data/deliveries";
import { canManageFleet } from "@/lib/domain/permissions";
import { DELIVERY_STATUS_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const delivery = await getDeliveryById(supabase, id);
  if (!delivery) {
    notFound();
  }

  const [profile, attachments] = await Promise.all([
    getCurrentProfile(),
    getAttachmentsByEntity(supabase, "delivery", delivery.id),
  ]);

  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {delivery.delivery_number ?? "Delivery"}
            </h1>
            <Badge variant={DELIVERY_STATUS_BADGE_VARIANT[delivery.status]}>
              {DELIVERY_STATUS_LABEL[delivery.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {delivery.trip?.trip_number ?? "No trip"}
            {delivery.recipient_name ? ` · ${delivery.recipient_name}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              {delivery.status === "ARRIVED" ? (
                <DeliveryConfirmationDialog
                  deliveryId={delivery.id}
                  expectedQuantity={delivery.expected_quantity}
                  quantityUnit={delivery.quantity_unit}
                />
              ) : null}
              <DeliveryStatusActions deliveryId={delivery.id} status={delivery.status} />
            </div>
          ) : null}
          <RaiseDisputeDialog
            deliveryId={delivery.id}
            tripId={delivery.trip_id}
            vehicleId={delivery.trip?.vehicle_id ?? null}
          />
        </div>
      </div>

      <DeliveryOverview delivery={delivery} />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Evidence</h2>
        <EvidenceList attachments={attachments} />
      </div>
    </div>
  );
}
