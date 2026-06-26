import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CreateSubjectForm } from "@/components/admin/create-subject-form";
import { deleteSubject } from "@/actions/admin";

export default async function AdminSubjectsPage() {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { resources: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Subjects</h1>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">New Subject</h2>
          </CardHeader>
          <CardContent>
            <CreateSubjectForm />
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 font-medium text-gray-600">Resources</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.map((subject) => (
              <tr key={subject.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{subject.name}</td>
                <td className="px-4 py-3 font-mono text-gray-500">{subject.slug}</td>
                <td className="px-4 py-3 text-gray-700">{subject.description ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{subject._count.resources}</td>
                <td className="px-4 py-3">
                  {subject._count.resources === 0 ? (
                    <form action={deleteSubject.bind(null, subject.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:underline"
                        onClick={(e) => {
                          if (!confirm(`Delete "${subject.name}"?`)) e.preventDefault();
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-gray-400">Has resources</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subjects.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No subjects yet. Run the seed to populate them.</p>
        )}
      </div>
    </div>
  );
}
