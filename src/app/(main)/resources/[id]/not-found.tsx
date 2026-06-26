import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResourceNotFound() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Resource Not Found
      </h1>
      <p className="text-gray-600 mb-8">
        The resource you&apos;re looking for doesn&apos;t exist or has been
        removed.
      </p>
      <Link href="/resources">
        <Button>Browse Resources</Button>
      </Link>
    </div>
  );
}
