"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";

const links = [
  { href: "/dashboard/resources", label: "My Resources" },
  { href: "/dashboard/import", label: "Import" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white min-h-screen flex flex-col">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Publisher
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href || pathname.startsWith(link.href + "/")
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
