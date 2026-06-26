import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-600">
          Sign in to access your academic resources
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-600">
          {message}
        </div>
      )}

      <AuthForm mode="login" />
    </div>
  );
}
