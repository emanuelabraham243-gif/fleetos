import { Radio } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function DispatchPage() {
  return (
    <PagePlaceholder
      icon={Radio}
      title="Dispatch"
      description="Assign vehicles and drivers to trips and monitor dispatch in real time."
    />
  );
}
