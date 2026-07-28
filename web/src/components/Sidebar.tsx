"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/store";

const NAV = [
  {
    section: "Operations",
    adminOnly: false,
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/loads/new", label: "Load Entry" },
      { href: "/loads", label: "Loads" },
    ],
  },
  {
    section: "Master Data",
    adminOnly: true,
    items: [
      { href: "/customers", label: "Customers" },
      { href: "/locations", label: "Locations" },
      { href: "/crew", label: "Crew" },
      { href: "/product-types", label: "Product Types" },
      { href: "/register", label: "Register" },
    ],
  },
  {
    section: "Finance",
    adminOnly: true,
    items: [
      { href: "/finance/payroll", label: "Payroll" },
      { href: "/finance/customer-billing", label: "Customer Billing" },
      { href: "/finance/invoices", label: "Invoices" },
    ],
  },
  {
    section: "Reports",
    adminOnly: true,
    items: [{ href: "/reports/load-entry", label: "Load Report" }],
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

  // Intelligence workspace takes over the full screen — hide the app sidebar.
  if (pathname.startsWith("/intelligence")) return null;

  const allHrefs = NAV.flatMap((group) => group.items.map((item) => item.href));
  const activeHref = allHrefs
    .filter((href) => matchesHref(pathname, href))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside className="flex h-full w-60 flex-none flex-col bg-ink text-paper">
      <div className="border-b border-ink-line px-5 py-5">
        <p className="text-lg font-semibold tracking-tight text-cream">
          3PL Work
        </p>
        <p className="text-[11px] font-medium uppercase tracking-widest text-steel-light">
          3PL Operations
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* 3PL Intelligence — flagship feature entry */}
        <div className="mb-4 px-1">
          <Link
            href="/intelligence"
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all ${matchesHref(pathname, "/intelligence")
                ? "border-l-2 border-rust bg-ink-soft font-semibold text-cream"
                : "border-l-2 border-transparent bg-linear-to-r from-rust-soft/10 to-transparent text-steel-light hover:bg-ink-soft hover:text-paper"
              }`}
          >
            <Sparkles
              size={18}
              className={`shrink-0 transition-colors ${matchesHref(pathname, "/intelligence")
                  ? "text-rust"
                  : "text-rust/60 group-hover:text-rust"
                }`}
            />
            <span className="font-medium">3PL Intelligence</span>
            <span className="ml-auto shrink-0 rounded-full bg-rust-soft/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              AI
            </span>
          </Link>
        </div>

        {NAV.filter((group) => !group.adminOnly || role === "admin").map(
          (group) => (
            <div key={group.section} className="mb-6">
              <div className="mb-3 border-t border-ink-line pt-4 first:border-t-0 first:pt-0">
                <p className="mb-2.5 mt-1 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/80">
                  {group.section}
                </p>
              </div>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-sm border-l-2 px-3 py-1.5 text-sm transition-colors ${active
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
