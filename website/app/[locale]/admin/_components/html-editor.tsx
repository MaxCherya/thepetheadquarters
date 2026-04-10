"use client";

import { useState } from "react";
import { Eye, Code } from "lucide-react";

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

type Mode = "edit" | "preview";

/**
 * Textarea with a preview tab. Renders raw HTML using the same
 * `.product-description` styles defined in globals.css so the preview
 * matches what customers actually see on the product page.
 */
export function HtmlEditor({ value, onChange, rows = 8, placeholder }: HtmlEditorProps) {
  const [mode, setMode] = useState<Mode>("edit");

  const inputStyle = {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--bg-border)",
    color: "var(--white)",
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-sm)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)",
    width: "100%",
    minHeight: `${rows * 1.5}rem`,
    lineHeight: 1.5,
  };

  return (
    <div>
      <div className="mb-2 flex gap-1 rounded-md p-1" style={{ background: "var(--bg-tertiary)", width: "fit-content" }}>
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="flex items-center gap-2 rounded-md px-3 py-1.5"
          style={{
            background: mode === "edit" ? "var(--bg-secondary)" : "transparent",
            color: mode === "edit" ? "var(--gold-dark)" : "var(--white-faint)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            fontWeight: mode === "edit" ? "var(--weight-semibold)" : "var(--weight-regular)",
          }}
        >
          <Code size={12} /> Edit
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className="flex items-center gap-2 rounded-md px-3 py-1.5"
          style={{
            background: mode === "preview" ? "var(--bg-secondary)" : "transparent",
            color: mode === "preview" ? "var(--gold-dark)" : "var(--white-faint)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            fontWeight: mode === "preview" ? "var(--weight-semibold)" : "var(--weight-regular)",
          }}
        >
          <Eye size={12} /> Preview
        </button>
      </div>

      {mode === "edit" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          style={inputStyle}
        />
      ) : (
        <div
          className="product-description"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--bg-border)",
            color: "var(--white)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4) var(--space-4)",
            minHeight: `${rows * 1.5}rem`,
            lineHeight: 1.6,
          }}
        >
          {value.trim() === "" ? (
            <p style={{ color: "var(--white-faint)", fontStyle: "italic" }}>
              Nothing to preview yet. Switch to Edit and start typing.
            </p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          )}
        </div>
      )}
    </div>
  );
}
