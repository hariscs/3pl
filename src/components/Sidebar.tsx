"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/lib/store";

const NAV = [
  { section: "Operations", items: [{ href: "/", label: "Dashboard" }] },
  {
    section: "Setup",
    items: [
      { href: "/register", label: "Register User" },
      { href: "/customers", label: "Customers" },
      { href: "/employees", label: "Employees" },
      { href: "/product-types", label: "Product Types" },
    ],
  },
  {
    section: "Loads",
    items: [
      { href: "/loads/new", label: "Load Entry" },
      { href: "/loads", label: "Loads" },
    ],
  },
  {
    section: "Reports",
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

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAppData();

  const allHrefs = NAV.flatMap((group) => group.items.map((item) => item.href));
  const activeHref = allHrefs
    .filter((href) => matchesHref(pathname, href))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside className="flex h-full w-60 flex-none flex-col bg-ink text-paper">
      <div className="border-b border-ink-line px-5 py-5">
        <p className="font-display text-lg font-semibold tracking-wide text-cream">
          Dockmaster
        </p>
        <p className="text-[11px] uppercase tracking-widest text-steel-light">
          3PL Operations
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="mb-1.5 px-2 font-display text-[10px] font-semibold uppercase tracking-widest text-steel-light">
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
                          ? "border-rust bg-ink-soft text-cream"
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
        ))}
      </nav>
      <div className="border-t border-ink-line px-5 py-4">
        <p className="text-[11px] uppercase tracking-widest text-steel-light">
          Signed in as
        </p>
        <p className="text-sm text-cream">
          {role === "admin" ? "Rick Alvarez · Admin" : "Josie Turner · Lead"}
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 inline-block text-xs text-steel-light underline hover:text-rust"
        >
          Preview forgot-password flow
        </Link>
      </div>
    </aside>
  );
}
