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

    const revealed = new WeakSet<Element>();

    const reveal = (el: Element) => {
      if (revealed.has(el)) return;
      revealed.add(el);

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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px 50px 0px" },
    );
    observerRef.current = observer;

    const processElements = () => {
      const elements = document.querySelectorAll("[data-animate]");
      elements.forEach((el) => {
        if (revealed.has(el)) return;

        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 50 && rect.bottom > 0) {
          reveal(el);
        } else {
          observer.observe(el);
        }
      });
    };

    const timer = setTimeout(processElements, 100);

    const mo = new MutationObserver(() => {
      processElements();
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: false });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mo.disconnect();
    };
  }, [pathname, mounted]);

  return null;
}
