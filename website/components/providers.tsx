"use client";

import { Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toast } from "@heroui/react";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { CookieNotice } from "@/components/cookie-notice";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          {/* useSearchParams needs a Suspense boundary in the App Router */}
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          {children}
          <CookieNotice />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export function ToastContainer() {
  return <Toast.Provider placement="bottom end" maxVisibleToasts={3} />;
}
