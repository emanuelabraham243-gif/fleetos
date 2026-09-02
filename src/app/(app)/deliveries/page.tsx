import { Boxes } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function DeliveriesPage() {
  return (
    <PagePlaceholder
      icon={Boxes}
      title="Deliveries"
      description="Track individual deliveries and proof of delivery for each stop."
    />
  );
}
