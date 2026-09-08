import { randomUUID } from "node:crypto";

import { CheckInWizard } from "@/components/check-in-wizard";
import { getPublicCheckInCatalog } from "@/lib/check-in/data";

export default async function CheckInPage() {
  const catalog = await getPublicCheckInCatalog();

  return <CheckInWizard catalog={catalog} initialIdempotencyKey={randomUUID()} />;
}
