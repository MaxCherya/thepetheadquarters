"use client";

import { useEffect, useState } from "react";

interface CurrencyInputProps {
  /** Value in pence (smallest unit) */
  value: number | null;
  /** Callback receives value in pence (or null if cleared) */
  onChange: (pence: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowNull?: boolean;
  width?: string;
  className?: string;
}

/**
 * Currency input that accepts pound values (e.g. 3.20, 14.99) but stores
 * the value in pence. Handles decimals naturally.
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  disabled = false,
  allowNull = false,
  width = "100%",
  className = "",
}: CurrencyInputProps) {
  // Local string state so user can type "3." without losing focus
  const [text, setText] = useState<string>(value === null || value === undefined ? "" : (value / 100).toFixed(2));

  // Sync if external value changes (e.g. form reset)
  useEffect(() => {
    if (value === null || value === undefined) {
      setText("");
    } else {
      // Only resync if the parsed text differs from incoming value
      const parsed = parseFloat(text);
      const currentPence = isNaN(parsed) ? null : Math.round(parsed * 100);
      if (currentPence !== value) {
        setText((value / 100).toFixed(2));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;

    // Allow empty
    if (raw === "") {
      setText("");
      onChange(allowNull ? null : 0);
      return;
    }

    // Only allow digits, single decimal, max 2 decimals
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;

    setText(raw);

    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      onChange(allowNull ? null : 0);
    } else {
      onChange(Math.round(parsed * 100));
    }
  }

  function handleBlur() {
    if (text === "") return;
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      setText(parsed.toFixed(2));
    }
  }

  return (
    <div className={`relative ${className}`} style={{ width }}>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
          color: "var(--white-faint)",
        }}
      >
        £
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full outline-none"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--bg-border)",
          color: "var(--white)",
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-3) var(--space-4) var(--space-3) var(--space-8)",
        }}
      />
    </div>
  );
}
