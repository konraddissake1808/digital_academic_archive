"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title A–Z" },
  { value: "price", label: "Price" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function SortBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get("sort") ?? "newest";

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SORT_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleClick(value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            activeSort === value
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
