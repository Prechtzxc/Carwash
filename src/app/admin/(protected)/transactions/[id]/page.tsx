import { notFound } from "next/navigation";
import { z } from "zod";

import { TransactionReview } from "@/components/admin-transaction-review";
import { getAdminTransactionReviewPageData } from "@/lib/transactions/data";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const data = await getAdminTransactionReviewPageData(parsedId.data);

  if (!data) {
    notFound();
  }

  return <TransactionReview data={data} />;
}
