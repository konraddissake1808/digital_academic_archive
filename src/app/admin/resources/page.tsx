import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { TableFilters } from "@/components/table-filters";
import { setResourcePublished, deleteResource } from "@/actions/admin";

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subject?: string }>;
}) {
  const { category, subject } = await searchParams;

  const [resources, categories, subjects] = await Promise.all([
    prisma.resource.findMany({
      where: {
        ...(category ? { category: { slug: category } } : {}),
        ...(subject ? { subject: { slug: subject } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        subject: { select: { name: true } },
        createdBy: { select: { fullName: true, email: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <TableFilters categories={categories} subjects={subjects} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 font-medium text-gray-600">Subject</th>
              <th className="px-4 py-3 font-medium text-gray-600">Author</th>
              <th className="px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 line-clamp-1">{resource.title}</p>
                  <p className="text-gray-500 line-clamp-1">{resource.description}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{resource.category.name}</td>
                <td className="px-4 py-3 text-gray-700">{resource.subject?.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">
                  {resource.createdBy.fullName ?? resource.createdBy.email}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {resource.isFree ? "Free" : `$${Number(resource.price).toFixed(2)}`}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={resource.isPublished ? "success" : "default"}>
                    {resource.isPublished ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <form action={setResourcePublished.bind(null, resource.id, !resource.isPublished)}>
                      <button type="submit" className="text-xs font-medium text-blue-600 hover:underline">
                        {resource.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteResource.bind(null, resource.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:underline"
                        onClick={(e) => { if (!confirm(`Delete "${resource.title}"?`)) e.preventDefault(); }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No resources match the selected filters.</p>
        )}
      </div>
    </div>
  );
}
