import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
            Your Digital{" "}
            <span className="text-blue-600">Academic Archive</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
            Access research papers, textbooks, lecture notes, and more. A
            curated collection of academic resources to support your studies.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href="/resources">
              <Button size="lg">Browse Resources</Button>
            </Link>
            <Link href="/signup">
              <Button variant="secondary" size="lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
