"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function ScrollAnimations() {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    window.scrollTo(0, 0);
    observerRef.current?.disconnect();

    const reveal = (el: Element) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.getAttribute("data-animate") === "stagger") {
        Array.from(htmlEl.children).forEach((child, i) => {
          setTimeout(() => {
            (child as HTMLElement).style.opacity = "1";
            (child as HTMLElement).style.transform = "none";
          }, i * 100);
        });
      } else {
        htmlEl.style.opacity = "1";
        htmlEl.style.transform = "none";
      }
    };

    const setup = () => {
      const elements = document.querySelectorAll("[data-animate]");
      if (elements.length === 0) return;

      elements.forEach((el) => {
        const h = el as HTMLElement;
        h.style.removeProperty("opacity");
        h.style.removeProperty("transform");
        if (h.getAttribute("data-animate") === "stagger") {
          Array.from(h.children).forEach((c) => {
            (c as HTMLElement).style.removeProperty("opacity");
            (c as HTMLElement).style.removeProperty("transform");
          });
        }
      });

      void document.body.offsetHeight;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              reveal(entry.target);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0, rootMargin: "0px 0px 50px 0px" },
      );

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 50 && rect.bottom > 0) {
          setTimeout(() => reveal(el), 50);
        } else {
          observerRef.current?.observe(el);
        }
      });
    };

    const t1 = setTimeout(setup, 100);
    const t2 = setTimeout(setup, 400);

    const mo = new MutationObserver(() => {
      document.querySelectorAll("[data-animate]").forEach((el) => {
        if ((el as HTMLElement).style.opacity !== "1") {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 50 && rect.bottom > 0) {
            reveal(el);
          } else {
            observerRef.current?.observe(el);
          }
        }
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observerRef.current?.disconnect();
      mo.disconnect();
    };
  }, [pathname, mounted]);

  return null;
}
