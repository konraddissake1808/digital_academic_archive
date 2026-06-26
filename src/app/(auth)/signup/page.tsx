import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
        <p className="mt-1 text-sm text-gray-600">
          Join the academic archive to access resources
        </p>
      </div>

      <AuthForm mode="signup" />
    </div>
  );
}
