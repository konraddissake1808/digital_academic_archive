"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Subject { id: string; name: string; slug: string; }

export function SubjectFilter({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSubject = searchParams.get("subject");

  function handleClick(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("subject", slug);
    else params.delete("subject");
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleClick(null)}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          !activeSubject ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        All subjects
      </button>
      {subjects.map((subject) => (
        <button
          key={subject.id}
          onClick={() => handleClick(subject.slug)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            activeSubject === subject.slug
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {subject.name}
        </button>
      ))}
    </div>
  );
}
