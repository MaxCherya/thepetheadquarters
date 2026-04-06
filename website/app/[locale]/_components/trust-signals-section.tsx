import { Lock, Stethoscope, MapPin, HeadphonesIcon } from "lucide-react";

const icons = [Lock, Stethoscope, MapPin, HeadphonesIcon];

interface TrustSignalsSectionProps {
  dict: {
    label: string;
    items: { title: string; description: string }[];
  };
}

export function TrustSignalsSection({ dict }: TrustSignalsSectionProps) {
  return (
    <section className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center md:mb-12">
          <span
            className="mb-4 block"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-widest)",
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            {dict.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {dict.items.map((item, index) => {
            const Icon = icons[index % icons.length];
            return (
              <div key={item.title} className="text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:mb-4 sm:h-14 sm:w-14"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.2)",
                  }}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "var(--gold)" }} />
                </div>
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--weight-semibold)",
                    color: "var(--white)",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-sm)",
                    color: "var(--white-dim)",
                  }}
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
