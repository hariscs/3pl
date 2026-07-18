"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/store";

const NAV = [
  {
    section: "Operations",
    adminOnly: false,
    items: [{ href: "/", label: "Dashboard" }],
  },
  {
    section: "Setup",
    adminOnly: true,
    items: [
      { href: "/register", label: "Register" },
      { href: "/locations", label: "Locations" },
      { href: "/customers", label: "Customers" },
      { href: "/crew", label: "Crew" },
      { href: "/product-types", label: "Product Types" },
    ],
  },
  {
    section: "Loads",
    adminOnly: false,
    items: [
      { href: "/loads/new", label: "Load Entry" },
      { href: "/loads", label: "Loads" },
    ],
  },
  {
    section: "Reports",
    adminOnly: true,
    items: [
      { href: "/reports/load-entry", label: "Load Entry Report" },
      { href: "/reports/invoice", label: "Invoice Report" },
    ],
  },
];

function matchesHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAppData();
  const { user, logout } = useAuth();

  const allHrefs = NAV.flatMap((group) => group.items.map((item) => item.href));
  const activeHref = allHrefs
    .filter((href) => matchesHref(pathname, href))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside className="flex h-full w-60 flex-none flex-col bg-ink text-paper">
      <div className="border-b border-ink-line px-5 py-5">
        <p className="text-lg font-semibold tracking-tight text-cream">
          Dockmaster
        </p>
        <p className="text-[11px] font-medium uppercase tracking-widest text-steel-light">
          3PL Operations
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.filter((group) => !group.adminOnly || role === "admin").map(
          (group) => (
            <div key={group.section} className="mb-5">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-steel-light">
                {group.section}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-sm border-l-2 px-3 py-1.5 text-sm transition-colors ${
                          active
                            ? "border-rust bg-ink-soft font-semibold text-cream"
                            : "border-transparent text-steel-light hover:bg-ink-soft hover:text-paper"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ),
        )}
      </nav>
      <div className="border-t border-ink-line px-5 py-4">
        <p className="text-[11px] uppercase tracking-widest text-steel-light">
          Signed in as
        </p>
        <p className="text-sm font-medium text-cream">
          {user ? `${user.name} · ${capitalize(user.role)}` : "—"}
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-2 inline-block text-xs text-steel-light transition-colors hover:text-rust"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
