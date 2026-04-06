"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const invertedRef = useRef(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouch(true);
      return;
    }

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let mouseX = -100;
    let mouseY = -100;
    let rafId: number;

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function animate() {
      if (visibleRef.current) {
        gsap.to(dot, { x: mouseX, y: mouseY, duration: 0.08, ease: "power3.out", overwrite: true });
        gsap.to(ring, { x: mouseX, y: mouseY, duration: 0.4, ease: "power3.out", overwrite: true });
      }
      rafId = requestAnimationFrame(animate);
    }

    function show(e: Event) {
      if (visibleRef.current) return;
      visibleRef.current = true;

      gsap.set(ring, { x: mouseX, y: mouseY });
      gsap.set(dot, { x: mouseX, y: mouseY });
      gsap.to(ring, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out", overwrite: true });
      gsap.to(dot, { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out", overwrite: true });
    }

    function hide() {
      if (!visibleRef.current) return;
      visibleRef.current = false;
      gsap.to(ring, { scale: 0, duration: 0.2, ease: "power2.in", overwrite: true });
      gsap.to(dot, { scale: 0, duration: 0.15, ease: "power2.in", overwrite: true });
    }

    function onMouseDown() {
      if (!visibleRef.current) return;
      gsap.to(ring, { scale: 0.7, duration: 0.12, ease: "power2.out" });
      gsap.to(dot, { scale: 0.5, duration: 0.12, ease: "power2.out" });
    }

    function onMouseUp() {
      if (!visibleRef.current) return;
      gsap.to(ring, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" });
      gsap.to(dot, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" });
    }

    const CLICKABLE =
      "a, button, [role='button'], label, select, summary, " +
      "[type='submit'], [type='button'], .cursor-pointer";

    function addListeners() {
      const elements = document.querySelectorAll(CLICKABLE);
      elements.forEach((el) => {
        el.addEventListener("mouseenter", show);
        el.addEventListener("mouseleave", hide);
      });
      return elements;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    rafId = requestAnimationFrame(animate);
    let currentElements = addListeners();

    const observer = new MutationObserver(() => {
      currentElements.forEach((el) => {
        el.removeEventListener("mouseenter", show);
        el.removeEventListener("mouseleave", hide);
      });
      currentElements = addListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      cancelAnimationFrame(rafId);
      observer.disconnect();
      currentElements.forEach((el) => {
        el.removeEventListener("mouseenter", show);
        el.removeEventListener("mouseleave", hide);
      });
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999]"
        style={{
          width: 55,
          height: 55,
          marginLeft: -27.5,
          marginTop: -27.5,
          borderRadius: "50%",
          border: "4px solid #ffffff",
          boxShadow: "0 0 0 3px #000000, 0 0 20px rgba(255,255,255,0.4)",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999]"
        style={{
          width: 12,
          height: 12,
          marginLeft: -6,
          marginTop: -6,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 0 0 3px #000000, 0 0 10px rgba(255,255,255,0.5)",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />
    </>
  );
}
