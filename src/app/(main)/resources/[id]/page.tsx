import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PurchaseButton } from "@/components/purchase-button";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  if (!resource) return { title: "Resource Not Found" };

  return {
    title: `${resource.title} — AcademicArchive`,
    description: resource.description.slice(0, 160),
  };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [resource, purchase] = await Promise.all([
    prisma.resource.findUnique({
      where: { id, isPublished: true },
      include: {
        category: true,
        subject: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    }),
    user
      ? prisma.purchase.findUnique({
          where: { userId_resourceId: { userId: user.id, resourceId: id } },
          select: { status: true },
        })
      : null,
  ]);

  if (!resource) notFound();

  const hasPurchased = purchase?.status === "PAID";
  const canAccess = resource.isFree || hasPurchased;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/resources"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to resources
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="info">{resource.category.name}</Badge>
            {resource.subject && <Badge variant="default">{resource.subject.name}</Badge>}
            {resource.fileType && <Badge>{resource.fileType.toUpperCase()}</Badge>}
            <Badge variant={resource.isFree ? "success" : "warning"}>
              {resource.isFree ? "Free" : formatPrice(resource.price)}
            </Badge>
            {hasPurchased && <Badge variant="success">Purchased</Badge>}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{resource.title}</h1>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
            {resource.createdBy.fullName && <span>By {resource.createdBy.fullName}</span>}
            <span>
              Published{" "}
              {resource.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {resource.pageCount && <span>{resource.pageCount} pages</span>}
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{resource.description}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-2xl font-bold text-gray-900">{formatPrice(resource.price)}</p>

          {canAccess && resource.fileUrl ? (
            <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg">Download</Button>
            </a>
          ) : canAccess ? (
            <Button size="lg" disabled>No file available yet</Button>
          ) : !user ? (
            <Link href={`/login?next=/resources/${resource.id}`}>
              <Button size="lg">Sign in to Purchase</Button>
            </Link>
          ) : (
            <PurchaseButton resourceId={resource.id} />
          )}
        </div>
      </div>
    </div>
  );
}
