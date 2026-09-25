import type { HTMLAttributes } from "react";
import { MarkNeq } from "./MarkNeq";

export interface MapPinProps extends HTMLAttributes<HTMLDivElement> {
  size?: "default" | "small" | "large";
}

export function MapPin({ size = "default", className = "", style, ...props }: MapPinProps) {
  const sizeClasses = {
    small: "map-pin--small",
    default: "",
    large: "map-pin--large",
  };

  const baseStyle: React.CSSProperties = {
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "var(--color-white)",
    boxShadow: "0 2px 8px rgba(0,0,0,.25)",
    ...style,
  };

  const sizeStyle: Record<string, React.CSSProperties> = {
    small: { width: "32px", height: "32px" },
    default: { width: "clamp(40px, 6vw, 88px)", height: "clamp(40px, 6vw, 88px)" },
    large: { width: "clamp(60px, 8vw, 120px)", height: "clamp(60px, 8vw, 120px)" },
  };

  return (
    <div
      className={`map-pin ${sizeClasses[size]} ${className}`.trim()}
      style={{ ...baseStyle, ...sizeStyle[size] }}
      {...props}
    >
      <MarkNeq size="default" aria-hidden={true} style={{ width: "60%", height: "60%" }} />
    </div>
  );
}