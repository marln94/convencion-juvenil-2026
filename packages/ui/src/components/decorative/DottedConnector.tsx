import type { HTMLAttributes } from "react";

export interface DottedConnectorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "L" | "reverse-L" | "vertical" | "horizontal";
}

export function DottedConnector({
  orientation = "L",
  className = "",
  style,
  ...props
}: DottedConnectorProps) {
  const baseStyle: React.CSSProperties = {
    position: "relative",
    ...style,
  };

  const orientationStyles: Record<string, React.CSSProperties> = {
    L: {
      borderLeft: "4px dotted var(--color-ink)",
      borderBottom: "4px dotted var(--color-ink)",
    },
    "reverse-L": {
      borderRight: "4px dotted var(--color-ink)",
      borderBottom: "4px dotted var(--color-ink)",
    },
    vertical: {
      borderLeft: "4px dotted var(--color-ink)",
    },
    horizontal: {
      borderBottom: "4px dotted var(--color-ink)",
    },
  };

  return (
    <div
      className={`dotted-connector ${className}`.trim()}
      style={{
        ...baseStyle,
        ...orientationStyles[orientation],
      }}
      {...props}
      aria-hidden="true"
    />
  );
}