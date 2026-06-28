import { prisma } from "@/lib/prisma";
import { ImportForm } from "@/components/dashboard/import-form";

export const metadata = {
  title: "Import Resources — Publisher Dashboard",
};

export default async function ImportPage() {
  const [categories, subjects] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import Resources</h1>
        <p className="mt-1 text-gray-500">
          Upload one or more files at once. Set the category and metadata for each, then click Import.
          Resources are published immediately by default — uncheck &ldquo;Publish immediately&rdquo; to save as drafts instead.
        </p>
      </div>

      <ImportForm categories={categories} subjects={subjects} />
    </div>
  );
}
