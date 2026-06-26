import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [userCount, resourceCount, publishedCount, categoryCount, purchaseCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.resource.count(),
      prisma.resource.count({ where: { isPublished: true } }),
      prisma.category.count(),
      prisma.purchase.count(),
    ]);

  const stats = [
    { label: "Total Users", value: userCount },
    { label: "Total Resources", value: resourceCount },
    { label: "Published", value: publishedCount },
    { label: "Drafts", value: resourceCount - publishedCount },
    { label: "Categories", value: categoryCount },
    { label: "Purchases", value: purchaseCount },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
