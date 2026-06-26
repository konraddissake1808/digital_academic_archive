"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface FilterOption { id: string; name: string; slug: string; }

interface TableFiltersProps {
  categories: FilterOption[];
  subjects: FilterOption[];
}

export function TableFilters({ categories, subjects }: TableFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectClass =
    "rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
        className={selectClass}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>

      <select
        value={searchParams.get("subject") ?? ""}
        onChange={(e) => update("subject", e.target.value)}
        className={selectClass}
      >
        <option value="">All subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.slug}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
