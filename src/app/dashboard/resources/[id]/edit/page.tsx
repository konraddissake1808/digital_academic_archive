import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ResourceForm } from "@/components/dashboard/resource-form";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const where = dbUser?.role === "ADMIN" ? { id } : { id, createdById: user.id };

  const [resource, categories, subjects] = await Promise.all([
    prisma.resource.findUnique({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!resource) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Resource</h1>
      <ResourceForm
        categories={categories}
        subjects={subjects}
        initialData={{
          id: resource.id,
          title: resource.title,
          description: resource.description,
          categoryId: resource.categoryId,
          subjectId: resource.subjectId,
          isFree: resource.isFree,
          price: Number(resource.price),
          fileType: resource.fileType ?? "",
          pageCount: resource.pageCount,
          fileUrl: resource.fileUrl,
          coverUrl: resource.coverUrl,
        }}
      />
    </div>
  );
}
