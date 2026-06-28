export const dynamic = "force-dynamic";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { ResourceGrid } from "@/components/resource-grid";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const resources = await prisma.resource.findMany({
    where: { isPublished: true },
    include: {
      category: true,
      subject: true,
      createdBy: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Latest Resources
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Recently published academic materials
              </p>
            </div>
            <Link href="/resources">
              <Button variant="secondary" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <ResourceGrid resources={resources} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
