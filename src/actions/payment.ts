"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cinetpayInitiate } from "@/lib/cinetpay";

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

  const transactionId = randomUUID();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Create or reset the pending purchase record
  await prisma.purchase.upsert({
    where: { userId_resourceId: { userId: user.id, resourceId } },
    create: {
      userId: user.id,
      resourceId,
      amountPaid: resource.price,
      cinetpayTransactionId: transactionId,
      status: "PENDING",
    },
    update: {
      cinetpayTransactionId: transactionId,
      status: "PENDING",
    },
  });

  const nameParts = (dbUser?.fullName ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const paymentUrl = await cinetpayInitiate({
    transactionId,
    amount: Math.round(Number(resource.price)),
    description: resource.title,
    returnUrl: `${baseUrl}/payment/return?tid=${transactionId}`,
    notifyUrl: `${baseUrl}/api/payment/notify`,
    customerId: user.id,
    customerName: firstName,
    customerSurname: lastName,
    customerEmail: dbUser?.email ?? user.email ?? "",
  });

  return { paymentUrl };
}
