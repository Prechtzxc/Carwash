import { notFound } from "next/navigation";
import { z } from "zod";

import { AdminClientDetail } from "@/components/admin-client-detail";
import { getAdminClientDetail } from "@/lib/clients/data";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const detail = await getAdminClientDetail(parsedId.data);

  if (!detail) {
    notFound();
  }

  return <AdminClientDetail detail={detail} />;
}
