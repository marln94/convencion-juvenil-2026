import type { SVGProps } from "react";

const NeqSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Diferente"
  >
    <defs>
      <filter id="roughness" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    <path
      d="M20 20 L80 80 M80 20 L20 80"
      stroke="var(--color-red)"
      stroke-width="8"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#roughness)"
    />
  </svg>
);

export interface MarkNeqProps {
  className?: string;
  style?: React.CSSProperties;
  size?: "default" | "hero";
  "aria-hidden"?: boolean;
}

export function MarkNeq({ className = "", style, size = "default", "aria-hidden": ariaHidden = false }: MarkNeqProps) {
  const baseClass = "mark-neq";
  const sizeClass = size === "hero" ? "hero__neq" : "";

  return (
    <NeqSvg
      className={`${baseClass} ${sizeClass} ${className}`.trim()}
      style={style}
      aria-hidden={ariaHidden}
      role={ariaHidden ? "presentation" : "img"}
    />
  );
}