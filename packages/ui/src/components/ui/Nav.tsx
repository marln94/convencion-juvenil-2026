import type { HTMLAttributes } from "react";

export type NavOrientation = "horizontal" | "vertical";

export interface NavItem {
  id: string;
  label: string;
  current?: boolean;
}

export interface NavProps extends HTMLAttributes<HTMLElement> {
  items: NavItem[];
  onNavigate: (id: string) => void;
  orientation?: NavOrientation;
}

export function Nav({
  items,
  onNavigate,
  orientation = "horizontal",
  className = "",
  ...props
}: NavProps) {
  const vertical = orientation === "vertical";
  const listClasses = vertical
    ? "flex w-full flex-col gap-1 p-1"
    : "flex w-full overflow-x-auto gap-1 p-1";
  const itemClasses = vertical ? "shrink-0" : "min-w-0 flex-1";
  const alignmentClasses = vertical ? "text-left" : "text-center";

  return (
    <nav
      className={`nav ${vertical ? "nav--vertical" : ""} ${className}`.trim()}
      {...props}
      aria-label="Navegación principal"
    >
      <ul className={listClasses}>
        {items.map((item) => (
          <li key={item.id} className={itemClasses}>
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full px-3 py-2 text-sm font-medium transition-colors ${alignmentClasses} ${item.current ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text)] hover:bg-[var(--color-border)] hover:text-white"}`}
              aria-current={item.current ? "page" : undefined}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
