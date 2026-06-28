export const dynamic = "force-dynamic";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ResourcesBrowser } from "@/components/resources-browser";

export const metadata = {
  title: "Browse Resources — AcademicArchive",
  description: "Search and browse academic resources",
};

const getCachedCategories = unstable_cache(
  () => prisma.category.findMany({ orderBy: { name: "asc" } }),
  ["categories"],
  { tags: ["categories"], revalidate: 3600 }
);

const getCachedSubjects = unstable_cache(
  () => prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ["subjects"],
  { tags: ["subjects"], revalidate: 3600 }
);

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; subject?: string; sort?: string }>;
}) {
  const { q, category, subject, sort } = await searchParams;

  const [rawResources, categories, subjects] = await Promise.all([
    prisma.resource.findMany({
      where: { isPublished: true },
      include: {
        category: true,
        subject: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getCachedCategories(),
    getCachedSubjects(),
  ]);

  // Prisma Decimal and Date objects can't cross the server→client boundary;
  // convert them to plain serializable values here.
  const resources = rawResources.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    price: r.price.toString(),
    isFree: r.isFree,
    fileType: r.fileType,
    createdAt: r.createdAt.toISOString(),
    category: { name: r.category.name, slug: r.category.slug },
    subject: r.subject ? { name: r.subject.name, slug: r.subject.slug } : null,
    createdBy: { fullName: r.createdBy.fullName },
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Resources</h1>
        <p className="mt-2 text-gray-600">Search through our collection of academic materials</p>
      </div>

      <ResourcesBrowser
        resources={resources}
        categories={categories}
        subjects={subjects}
        initialCategory={category}
        initialSubject={subject}
        initialSort={sort}
        initialQuery={q}
      />
    </div>
  );
}
