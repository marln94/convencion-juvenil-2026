import type { HTMLAttributes } from "react";

export type BrushPosition = "tr" | "bl";

export interface BrushProps extends HTMLAttributes<HTMLDivElement> {
  position: BrushPosition;
}

const POSITION_CLASSES: Record<BrushPosition, string> = {
  tr: "brush--tr",
  bl: "brush--bl",
};

export function Brush({ position, className = "", style, ...props }: BrushProps) {
  return (
    <div
      className={`brush ${POSITION_CLASSES[position]} ${className}`.trim()}
      style={style}
      {...props}
      aria-hidden="true"
    />
  );
}
