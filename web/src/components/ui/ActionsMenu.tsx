"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Action = { label: string; onSelect: () => void; danger?: boolean };

/** Menu panel size, used to keep the portal-rendered dropdown on-screen. */
const MENU_WIDTH = 176;
const MENU_MARGIN = 8;

export function ActionsMenu({
  actions,
  label = "Open actions",
}: {
  actions: Action[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + MENU_MARGIN,
        left: Math.min(
          rect.right - MENU_WIDTH,
          window.innerWidth - MENU_WIDTH - MENU_MARGIN,
        ),
      });
    }

    place();

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-steel transition-colors hover:bg-paper-dim hover:text-ink"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              top: position.top,
              left: position.left,
              width: MENU_WIDTH,
            }}
            className="animate-global-drop-in fixed z-50 overflow-hidden rounded-xl border border-manila-dark bg-cream py-1 shadow-lg"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
                className={`block w-full px-3.5 py-2 text-left text-sm transition-colors hover:bg-paper-dim ${
                  action.danger ? "text-stamp" : "text-ink"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
