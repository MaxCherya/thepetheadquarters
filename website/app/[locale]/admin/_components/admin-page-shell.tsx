import type { ReactNode } from "react";

interface AdminPageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageShell({ title, subtitle, actions, children }: AdminPageShellProps) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "var(--text-3xl)",
              fontWeight: "var(--weight-regular)",
              color: "var(--white)",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                color: "var(--white-faint)",
                marginTop: "var(--space-1)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
