import { ResourceCard } from "@/components/resource-card";

interface Resource {
  id: string;
  title: string;
  description: string;
  price: number | string | { toString(): string };
  isFree: boolean;
  category: { name: string };
  subject?: { name: string } | null;
  fileType?: string | null;
  createdBy: { fullName: string | null };
}

export function ResourceGrid({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No resources found</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          id={resource.id}
          title={resource.title}
          description={resource.description}
          price={resource.price}
          isFree={resource.isFree}
          categoryName={resource.category.name}
          subjectName={resource.subject?.name}
          fileType={resource.fileType}
          authorName={resource.createdBy.fullName}
        />
      ))}
    </div>
  );
}
