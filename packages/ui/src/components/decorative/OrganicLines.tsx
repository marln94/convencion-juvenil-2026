import type { HTMLAttributes } from "react";

export interface OrganicLinesProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle";
}

export function OrganicLines({ variant = "default", className = "", style, ...props }: OrganicLinesProps) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 1,
    overflow: "hidden",
    ...style,
  };

  return (
    <div className={className} style={baseStyle} {...props} aria-hidden="true">
      <svg
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-hidden="true"
      >
        {variant === "default" ? (
          <>
            <path
              d="M100 200 Q300 100 500 200 Q700 300 900 200 Q1100 100 1200 200"
              stroke="var(--color-ink)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.4"
            />
            <path
              d="M100 600 Q300 700 500 600 Q700 500 900 600 Q1100 700 1200 600"
              stroke="var(--color-ink)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.3"
            />
            <path
              d="M200 100 Q400 50 600 150 Q800 250 1000 100 Q1150 50 1200 300"
              stroke="var(--color-ink)"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.2"
            />
          </>
        ) : (
          <>
            <path
              d="M50 300 Q200 200 400 300 Q600 400 800 300 Q1000 200 1150 300"
              stroke="var(--color-ink)"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.15"
            />
            <path
              d="M50 500 Q200 600 400 500 Q600 400 800 500 Q1000 600 1150 500"
              stroke="var(--color-ink)"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.1"
            />
          </>
        )}
      </svg>
    </div>
  );
}