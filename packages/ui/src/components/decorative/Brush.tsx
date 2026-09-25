import type { HTMLAttributes } from "react";

export type BrushPosition = "tr" | "bl";

export interface BrushProps extends HTMLAttributes<HTMLDivElement> {
  position: BrushPosition;
}

export function Brush({ position, className = "", style, ...props }: BrushProps) {
  const positionClasses = {
    tr: "brush--tr",
    bl: "brush--bl",
  };

  return (
    <div
      className={`brush ${positionClasses[position]} ${className}`.trim()}
      style={style}
      {...props}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <filter id="brush-texture" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {position === "tr" ? (
          <>
            <ellipse
              cx="320"
              cy="80"
              rx="180"
              ry="120"
              fill="var(--color-red)"
              fill-opacity="0.4"
              filter="url(#brush-texture)"
            />
            <ellipse
              cx="350"
              cy="100"
              rx="140"
              ry="90"
              fill="var(--color-red-dark)"
              fill-opacity="0.3"
              filter="url(#brush-texture)"
            />
            <ellipse
              cx="370"
              cy="60"
              rx="100"
              ry="70"
              fill="var(--color-red-deep)"
              fill-opacity="0.2"
              filter="url(#brush-texture)"
            />
          </>
        ) : (
          <>
            <ellipse
              cx="80"
              cy="220"
              rx="190"
              ry="130"
              fill="var(--color-red)"
              fill-opacity="0.4"
              filter="url(#brush-texture)"
            />
            <ellipse
              cx="50"
              cy="200"
              rx="150"
              ry="100"
              fill="var(--color-red-dark)"
              fill-opacity="0.3"
              filter="url(#brush-texture)"
            />
            <ellipse
              cx="30"
              cy="240"
              rx="110"
              ry="80"
              fill="var(--color-red-deep)"
              fill-opacity="0.2"
              filter="url(#brush-texture)"
            />
          </>
        )}
      </svg>
    </div>
  );
}