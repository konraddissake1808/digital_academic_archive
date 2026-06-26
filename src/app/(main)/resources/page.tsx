export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { searchResources } from "@/actions/resources";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { SubjectFilter } from "@/components/subject-filter";
import { ResourceGrid } from "@/components/resource-grid";
import type { Resource, Category, Subject, User } from "@/generated/prisma/client";

export const metadata = {
  title: "Browse Resources — AcademicArchive",
  description: "Search and browse academic resources",
};

type ResourceWithRelations = Resource & {
  category: Category;
  subject: Subject | null;
  createdBy: Pick<User, "id" | "fullName" | "email">;
};

async function ResourceResults({
  query,
  categorySlug,
  subjectSlug,
}: {
  query?: string;
  categorySlug?: string;
  subjectSlug?: string;
}) {
  let resources: ResourceWithRelations[];

  if (query) {
    const searchResults = await searchResources(query);
    const resourceIds = searchResults.map((r) => r.id);
    resources = await prisma.resource.findMany({
      where: { id: { in: resourceIds }, isPublished: true },
      include: {
        category: true,
        subject: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    const idOrder = new Map(resourceIds.map((id, i) => [id, i]));
    resources.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));
  } else {
    resources = await prisma.resource.findMany({
      where: {
        isPublished: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
      },
      include: {
        category: true,
        subject: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  return <ResourceGrid resources={resources} />;
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; subject?: string }>;
}) {
  const { q, category, subject } = await searchParams;
  const [categories, subjects] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Resources</h1>
        <p className="mt-2 text-gray-600">Search through our collection of academic materials</p>
      </div>

      <div className="space-y-4">
        <Suspense fallback={null}><SearchBar /></Suspense>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Document type</p>
            <Suspense fallback={null}><CategoryFilter categories={categories} /></Suspense>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Subject</p>
            <Suspense fallback={null}><SubjectFilter subjects={subjects} /></Suspense>
          </div>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading…</div>}>
          <ResourceResults query={q} categorySlug={category} subjectSlug={subject} />
        </Suspense>
      </div>
    </div>
  );
}
