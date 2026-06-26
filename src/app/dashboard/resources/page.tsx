import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableFilters } from "@/components/table-filters";
import { formatPrice } from "@/lib/utils";
import { setPublished, deleteResource } from "@/actions/publisher";

export default async function DashboardResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subject?: string }>;
}) {
  const { category, subject } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [resources, categories, subjects, total] = await Promise.all([
    prisma.resource.findMany({
      where: {
        createdById: user.id,
        ...(category ? { category: { slug: category } } : {}),
        ...(subject ? { subject: { slug: subject } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        subject: { select: { name: true } },
        _count: { select: { purchases: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.resource.count({ where: { createdById: user.id } }),
  ]);

  const published = resources.filter((r) => r.isPublished).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Resources</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} total · {resources.filter((r) => r.isPublished).length} published · {resources.filter((r) => !r.isPublished).length} drafts
            {(category || subject) && <span className="ml-1 text-blue-600">(filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <TableFilters categories={categories} subjects={subjects} />
          <Link href="/dashboard/resources/new">
            <Button size="sm">New Resource</Button>
          </Link>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          {category || subject ? (
            <p className="text-gray-500">No resources match the selected filters.</p>
          ) : (
            <>
              <p className="text-gray-500 mb-4">You haven&apos;t created any resources yet.</p>
              <Link href="/dashboard/resources/new">
                <Button>Create your first resource</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Sales</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{resource.title}</p>
                    <p className="text-xs text-gray-400">{resource.createdAt.toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{resource.category.name}</td>
                  <td className="px-4 py-3 text-gray-600">{resource.subject?.name ?? <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{formatPrice(resource.price)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={resource.isPublished ? "success" : "default"}>
                      {resource.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{resource._count.purchases}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/resources/${resource.id}/edit`} className="text-xs font-medium text-gray-600 hover:underline">
                        Edit
                      </Link>
                      <form action={setPublished.bind(null, resource.id, !resource.isPublished)}>
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
        </div>
      )}
    </div>
  );
}
