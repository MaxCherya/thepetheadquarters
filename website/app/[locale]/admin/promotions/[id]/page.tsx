"use client";

import { use } from "react";
import { PromotionEditView } from "./_components/promotion-edit-view";

export default function AdminPromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PromotionEditView promotionId={id} />;
}
