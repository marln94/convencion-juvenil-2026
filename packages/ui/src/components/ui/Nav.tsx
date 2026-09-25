import type { HTMLAttributes, ReactNode, MouseEvent } from "react";

export interface NavItem {
  id: string;
  label: string;
  current?: boolean;
}

export interface NavProps extends HTMLAttributes<HTMLElement> {
  items: NavItem[];
  onNavigate: (id: string) => void;
}

export function Nav({ items, onNavigate, className = "", ...props }: NavProps) {
  return (
    <nav className={`nav ${className}`.trim()} {...props} aria-label="Navegación principal">
      <ul className="flex w-full overflow-x-auto gap-1 p-1">
        {items.map((item) => (
          <li key={item.id} className="flex-1">
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full min-h-12 px-3 text-sm font-medium transition-colors rounded-lg ${item.current ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'}`}
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