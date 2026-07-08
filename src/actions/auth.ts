"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

const SIGNUP_ROLES: readonly Role[] = ["STUDENT", "PUBLISHER"];

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const requestedRole = formData.get("role") as string;
  const role: Role = SIGNUP_ROLES.includes(requestedRole as Role)
    ? (requestedRole as Role)
    : "STUDENT";

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email!,
        fullName,
        role,
      },
    });
  }

  redirect("/login?message=Check your email to confirm your account");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const dbUser = data.user
    ? await prisma.user.findUnique({ where: { id: data.user.id }, select: { role: true } })
    : null;

  if (dbUser?.role === "ADMIN") redirect("/admin/dashboard");
  if (dbUser?.role === "PUBLISHER") redirect("/dashboard");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getMyRole(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  return dbUser?.role ?? null;
}
