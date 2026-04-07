"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export function ScrollAnimations() {
  const pathname = usePathname();

  const processElements = useCallback(() => {
    const elements = document.querySelectorAll("[data-animate]:not([data-animated])");
    if (elements.length === 0) return;

    // Reveal elements already in viewport
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 50 && rect.bottom > 0) {
        el.setAttribute("data-animated", "true");
      }
    });

    // Observe remaining for scroll
    const remaining = document.querySelectorAll("[data-animate]:not([data-animated])");
    if (remaining.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-animated", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px 50px 0px" },
    );

    remaining.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Scroll to top on navigation
    window.scrollTo(0, 0);

    // Run multiple times to catch elements that render late
    const t1 = setTimeout(processElements, 50);
    const t2 = setTimeout(processElements, 200);
    const t3 = setTimeout(processElements, 500);

    // Also watch for new elements being added to DOM
    const mutationObserver = new MutationObserver(() => {
      processElements();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      mutationObserver.disconnect();
    };
  }, [pathname, processElements]);

  return null;
}
