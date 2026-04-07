"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const elements = document.querySelectorAll("[data-animate]:not([data-animated])");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-animated", "true");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 },
      );

      elements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, 50);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
