import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { updateUserRole, updateUserTier } from "@/actions/admin";
import type { BadgeVariant } from "@/components/ui/badge";

const roleBadge: Record<string, BadgeVariant> = {
  ADMIN: "warning",
  PUBLISHER: "info",
  STUDENT: "default",
};

const tierBadge: Record<string, BadgeVariant> = {
  PREMIUM: "success",
  FREE: "default",
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { resources: true, purchases: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Users</h1>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-225 text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Name / Email</th>
              <th className="px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 font-medium text-gray-600">Tier</th>
              <th className="px-4 py-3 font-medium text-gray-600">Resources</th>
              <th className="px-4 py-3 font-medium text-gray-600">Purchases</th>
              <th className="px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="px-4 py-3 font-medium text-gray-600">Change Role</th>
              <th className="px-4 py-3 font-medium text-gray-600">Change Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{user.fullName ?? "—"}</p>
                  <p className="text-gray-500">{user.email}</p>
                  {user.institution && (
                    <p className="text-xs text-gray-400">{user.institution}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={roleBadge[user.role]}>{user.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={tierBadge[user.tier]}>{user.tier}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-700">{user._count.resources}</td>
                <td className="px-4 py-3 text-gray-700">{user._count.purchases}</td>
                <td className="px-4 py-3 text-gray-500">
                  {user.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateUserRole.bind(null, user.id)}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="PUBLISHER">Publisher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateUserTier.bind(null, user.id)}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="tier"
                      defaultValue={user.tier}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FREE">Free</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                    <button
                      type="submit"
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No users yet.</p>
        )}
      </div>
    </div>
  );
}
