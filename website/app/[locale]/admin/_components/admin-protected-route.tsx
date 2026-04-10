"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isStaff, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const locale = pathname.split("/")[1] || "en";
    if (!isAuthenticated) {
      router.replace(`/${locale}/account/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (!isStaff) {
      router.replace(`/${locale}/account`);
    }
  }, [isLoading, isAuthenticated, isStaff, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full"
          style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }}
        />
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) return null;

  return <>{children}</>;
}
