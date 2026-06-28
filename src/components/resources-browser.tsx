"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ResourceGrid } from "@/components/resource-grid";

interface Category { id: string; name: string; slug: string; }
interface Subject  { id: string; name: string; slug: string; }
interface Resource {
  id: string;
  title: string;
  description: string;
  price: string | number;
  isFree: boolean;
  fileType: string | null;
  createdAt: Date | string;
  category: { name: string; slug: string };
  subject: { name: string; slug: string } | null;
  createdBy: { fullName: string | null };
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title",  label: "Title A–Z" },
  { value: "price",  label: "Price" },
] as const;

export function ResourcesBrowser({
  resources,
  categories,
  subjects,
  initialCategory,
  initialSubject,
  initialSort = "newest",
  initialQuery = "",
}: {
  resources: Resource[];
  categories: Category[];
  subjects: Subject[];
  initialCategory?: string;
  initialSubject?: string;
  initialSort?: string;
  initialQuery?: string;
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory ?? null);
  const [activeSubject,  setActiveSubject]  = useState(initialSubject  ?? null);
  const [sort,  setSort]  = useState(initialSort);
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    let result = resources;

    if (activeCategory) result = result.filter(r => r.category.slug === activeCategory);
    if (activeSubject)  result = result.filter(r => r.subject?.slug  === activeSubject);

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime();
        case "title":  return a.title.localeCompare(b.title);
        case "price":  return Number(a.price) - Number(b.price);
        default:       return new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime();
      }
    });
  }, [resources, activeCategory, activeSubject, sort, query]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by title or description…"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Document type</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!activeCategory} onClick={() => setActiveCategory(null)}>All types</FilterChip>
            {categories.map(c => (
              <FilterChip key={c.id} active={activeCategory === c.slug} onClick={() => setActiveCategory(c.slug)}>
                {c.name}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Subject</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!activeSubject} onClick={() => setActiveSubject(null)}>All subjects</FilterChip>
            {subjects.map(s => (
              <FilterChip key={s.id} active={activeSubject === s.slug} onClick={() => setActiveSubject(s.slug)}>
                {s.name}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Sort by</p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(({ value, label }) => (
              <FilterChip key={value} active={sort === value} onClick={() => setSort(value)}>
                {label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <ResourceGrid resources={filtered} />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      )}
    >
      {children}
    </button>
  );
}
