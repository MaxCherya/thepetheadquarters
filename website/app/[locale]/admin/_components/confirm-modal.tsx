"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--bg-border)",
          padding: "var(--space-6)",
          margin: "var(--space-4)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-medium)",
            color: "var(--white)",
            marginBottom: "var(--space-3)",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            color: "var(--white-dim)",
            marginBottom: "var(--space-6)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-md px-5 py-2.5 transition-colors duration-200 disabled:opacity-50"
            style={{
              border: "1px solid var(--bg-border)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              color: "var(--white-dim)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-md px-5 py-2.5 transition-colors duration-200 disabled:opacity-50"
            style={{
              background: destructive ? "var(--error)" : "var(--gold)",
              color: "#FFFFFF",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
