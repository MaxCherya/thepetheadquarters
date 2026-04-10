"use client";

import { useRouter, usePathname } from "next/navigation";
import { toast } from "@heroui/react";
import { useCreatePromotion } from "@/hooks/use-admin-promotions";
import { PromotionForm } from "../_components/promotion-form";

export default function NewPromotionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const createMutation = useCreatePromotion();

  return (
    <div>
      <h1 className="mb-6" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
        New Promotion
      </h1>

      <PromotionForm
        submitting={createMutation.isPending}
        submitLabel="Create promotion"
        onCancel={() => router.push(`/${locale}/admin/promotions`)}
        onSubmit={async (data) => {
          try {
            const created = await createMutation.mutateAsync(data);
            toast.success("Promotion created");
            router.push(`/${locale}/admin/promotions/${created.id}`);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create promotion";
            toast.danger(message);
          }
        }}
      />
    </div>
  );
}
