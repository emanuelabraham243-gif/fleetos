import { Truck } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function NewVehiclePage() {
  return (
    <PagePlaceholder
      icon={Truck}
      title="Add Vehicle"
      description="The form to add a new vehicle to the fleet isn't built yet."
    />
  );
}
