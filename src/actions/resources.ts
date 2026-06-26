"use server";

import { createClient } from "@/lib/supabase/server";
import type { SearchResult } from "@/types";

export async function searchResources(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_resources", {
    search_query: query,
  });

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return (data as SearchResult[]) ?? [];
}
