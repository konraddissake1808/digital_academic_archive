"use client";

export function DeleteResourceButton({
  resourceId,
  title,
  action,
}: {
  resourceId: string;
  title: string;
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  async function handleClick() {
    if (!confirm(`Delete "${title}"?`)) return;
    await action(resourceId, new FormData());
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
