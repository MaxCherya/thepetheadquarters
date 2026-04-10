"use client";

import { use } from "react";
import { ProductEditView } from "./_components/product-edit-view";

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProductEditView productId={id} />;
}
