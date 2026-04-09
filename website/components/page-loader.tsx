"use client";

import { useEffect, useState } from "react";

export function PageLoader() {
  const [visible, setVisible] = useState(() => {
    // Only show on initial page load, not client-side navigation
    if (typeof window === "undefined") return true;
    return !window.__PAGE_LOADED__;
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Already loaded (client navigation) — skip
    if (window.__PAGE_LOADED__) {
      document.documentElement.classList.remove("page-loading");
      setVisible(false);
      return;
    }

    function onReady() {
      window.__PAGE_LOADED__ = true;
      setFading(true);
      setTimeout(() => {
        document.documentElement.classList.remove("page-loading");
        setVisible(false);
      }, 600);
    }

    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady);
      return () => {
        window.removeEventListener("load", onReady);
        document.documentElement.classList.remove("page-loading");
      };
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-6)",
        cursor: "not-allowed",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "3px solid var(--bg-border)",
          borderTopColor: "var(--gold)",
          borderRadius: "50%",
          animation: "loaderSpin 0.8s linear infinite",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "var(--text-xl)",
          fontWeight: "var(--weight-regular)",
          color: "var(--gold-dark)",
          letterSpacing: "var(--tracking-widest)",
        }}
      >
        The Pet Headquarters
      </span>
      <style>{`
        @keyframes loaderSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Extend Window type
declare global {
  interface Window {
    __PAGE_LOADED__?: boolean;
  }
}
