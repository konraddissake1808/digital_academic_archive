"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { campayInitiate } from "@/lib/campay";

export async function initiatePayment(resourceId: string): Promise<{ paymentUrl: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [resource, dbUser, existingPurchase] = await Promise.all([
    prisma.resource.findUnique({ where: { id: resourceId, isPublished: true } }),
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.purchase.findUnique({
      where: { userId_resourceId: { userId: user.id, resourceId } },
    }),
  ]);

  if (!resource) throw new Error("Resource not found");
  if (resource.isFree) throw new Error("This resource is free — no payment needed");
  if (existingPurchase?.status === "PAID") throw new Error("Already purchased");

  const externalReference = randomUUID();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const nameParts = (dbUser?.fullName ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const { paymentUrl, reference } = await campayInitiate({
    externalReference,
    amount: Math.round(Number(resource.price)),
    description: resource.title,
    redirectUrl: `${baseUrl}/payment/return?ref=${externalReference}`,
    failureRedirectUrl: `${baseUrl}/payment/return?ref=${externalReference}`,
    firstName,
    lastName,
    email: dbUser?.email ?? user.email ?? "",
  });

  // Create or reset the pending purchase record now that CamPay has confirmed the link
  await prisma.purchase.upsert({
    where: { userId_resourceId: { userId: user.id, resourceId } },
    create: {
      userId: user.id,
      resourceId,
      amountPaid: resource.price,
      externalReference,
      campayReference: reference,
      status: "PENDING",
    },
    update: {
      externalReference,
      campayReference: reference,
      status: "PENDING",
    },
  });

  return { paymentUrl };
}
