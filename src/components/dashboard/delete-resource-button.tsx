"use client";

import { deleteResource } from "@/actions/publisher";

export function DeleteResourceButton({
  resourceId,
  title,
}: {
  resourceId: string;
  title: string;
}) {
  async function handleClick() {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteResource(resourceId, new FormData());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs font-medium text-red-600 hover:underline"
    >
      Delete
    </button>
  );
}
