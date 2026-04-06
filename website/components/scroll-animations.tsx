"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollAnimations() {
  useEffect(() => {
    // Small delay to ensure DOM is fully hydrated
    const timeout = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Fade up
        gsap.utils.toArray<HTMLElement>("[data-animate='fade-up']").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        // Stagger children
        gsap.utils.toArray<HTMLElement>("[data-animate='stagger']").forEach((container) => {
          const children = Array.from(container.children) as HTMLElement[];
          gsap.set(children, { opacity: 0, y: 50 });
          ScrollTrigger.create({
            trigger: container,
            start: "top 85%",
            once: true,
            onEnter: () => {
              gsap.to(children, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
                clearProps: "transform,opacity",
              });
            },
          });
        });

        // Scale in
        gsap.utils.toArray<HTMLElement>("[data-animate='scale']").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: 0.9, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.7,
              ease: "power2.out",
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        // Fade in
        gsap.utils.toArray<HTMLElement>("[data-animate='fade']").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 1,
              ease: "power2.out",
              clearProps: "opacity",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        // Slide from left
        gsap.utils.toArray<HTMLElement>("[data-animate='slide-left']").forEach((el) => {
          gsap.fromTo(
            el,
            { x: -60, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        // Divider grow
        gsap.utils.toArray<HTMLElement>("[data-animate='divider']").forEach((el) => {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.8,
              ease: "power2.out",
              clearProps: "transform",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });
      });

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
