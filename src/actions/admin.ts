"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Role, Tier } from "@/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/");
  return dbUser;
}

export async function updateUserRole(userId: string, formData: FormData) {
  await requireAdmin();
  const role = formData.get("role") as Role;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function updateUserTier(userId: string, formData: FormData) {
  await requireAdmin();
  const tier = formData.get("tier") as Tier;
  await prisma.user.update({ where: { id: userId }, data: { tier } });
  revalidatePath("/admin/users");
}

export async function setResourcePublished(
  resourceId: string,
  published: boolean,
  _formData: FormData
) {
  await requireAdmin();
  await prisma.resource.update({
    where: { id: resourceId },
    data: { isPublished: published },
  });
  revalidatePath("/admin/resources");
}

export async function deleteResource(resourceId: string, _formData: FormData) {
  await requireAdmin();
  await prisma.purchase.deleteMany({ where: { resourceId } });
  await prisma.downloadLog.deleteMany({ where: { resourceId } });
  await prisma.resource.delete({ where: { id: resourceId } });
  revalidatePath("/admin/resources");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  await prisma.category.create({ data: { name, slug, description } });
  revalidateTag("categories", "max");
  revalidatePath("/admin/categories");
}

export async function deleteCategory(categoryId: string, _formData: FormData) {
  await requireAdmin();
  await prisma.category.delete({ where: { id: categoryId } });
  revalidateTag("categories", "max");
  revalidatePath("/admin/categories");
}

export async function createSubject(formData: FormData) {
  await requireAdmin();
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  await prisma.subject.create({ data: { name, slug, description } });
  revalidateTag("subjects", "max");
  revalidatePath("/admin/subjects");
}

export async function deleteSubject(subjectId: string, _formData: FormData) {
  await requireAdmin();
  await prisma.subject.delete({ where: { id: subjectId } });
  revalidateTag("subjects", "max");
  revalidatePath("/admin/subjects");
}
