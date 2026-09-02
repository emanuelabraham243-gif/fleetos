import { Fuel } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function FuelPage() {
  return (
    <PagePlaceholder
      icon={Fuel}
      title="Fuel"
      description="Fuel purchases and consumption against each vehicle's baseline."
    />
  );
}
