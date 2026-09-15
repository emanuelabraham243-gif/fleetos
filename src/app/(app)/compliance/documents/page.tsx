import { DocumentsExplorer } from "@/components/compliance/documents-explorer";
import { getAllDriverDocuments, getAllVehicleDocuments } from "@/lib/data/documents";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const [vehicleDocuments, driverDocuments] = await Promise.all([
    getAllVehicleDocuments(supabase),
    getAllDriverDocuments(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Vehicle and driver documents, with expiry tracking.
        </p>
      </div>

      <DocumentsExplorer vehicleDocuments={vehicleDocuments} driverDocuments={driverDocuments} />
    </div>
  );
}
