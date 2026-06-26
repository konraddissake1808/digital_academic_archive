import { prisma } from "@/lib/prisma";
import { ResourceForm } from "@/components/dashboard/resource-form";

export default async function NewResourcePage() {
  const [categories, subjects] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">New Resource</h1>
      <p className="mb-6 text-sm text-gray-500">
        Select a <strong>category</strong> (type of document) and a <strong>subject</strong> (academic discipline) to help readers find your work.
      </p>
      <ResourceForm categories={categories} subjects={subjects} />
    </div>
  );
}
