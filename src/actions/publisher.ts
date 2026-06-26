"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requirePublisher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || (dbUser.role !== "PUBLISHER" && dbUser.role !== "ADMIN")) {
    redirect("/");
  }
  return dbUser;
}

export type ResourceFormData = {
  title: string;
  description: string;
  categoryId: string;
  subjectId: string | null;
  price: number;
  isFree: boolean;
  fileType: string;
  pageCount: number | null;
  fileUrl: string | null;
  coverUrl: string | null;
};

export async function createResource(data: ResourceFormData): Promise<{ id: string }> {
  const user = await requirePublisher();
  const resource = await prisma.resource.create({
    data: { ...data, createdById: user.id },
  });
  revalidatePath("/dashboard/resources");
  return { id: resource.id };
}

export async function updateResource(
  resourceId: string,
  data: ResourceFormData
): Promise<void> {
  const user = await requirePublisher();
  const where =
    user.role === "ADMIN"
      ? { id: resourceId }
      : { id: resourceId, createdById: user.id };
  await prisma.resource.update({ where, data });
  revalidatePath("/dashboard/resources");
  revalidatePath(`/resources/${resourceId}`);
}

export async function setPublished(
  resourceId: string,
  published: boolean,
  _formData: FormData
) {
  const user = await requirePublisher();
  const where =
    user.role === "ADMIN"
      ? { id: resourceId }
      : { id: resourceId, createdById: user.id };
  await prisma.resource.update({ where, data: { isPublished: published } });
  revalidatePath("/dashboard/resources");
}

export async function deleteResource(resourceId: string, _formData: FormData) {
  const user = await requirePublisher();
  const where =
    user.role === "ADMIN"
      ? { id: resourceId }
      : { id: resourceId, createdById: user.id };
  await prisma.purchase.deleteMany({ where: { resourceId } });
  await prisma.resource.delete({ where });
  revalidatePath("/dashboard/resources");
}
