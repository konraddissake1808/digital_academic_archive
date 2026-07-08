"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { campayInitiate } from "@/lib/campay";
import { PREMIUM_PRICE_XAF, PREMIUM_DURATION_DAYS } from "@/lib/subscription";

export async function initiateSubscriptionPurchase(): Promise<
  { paymentUrl: string } | { error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");

  // Errors thrown past this point would otherwise be redacted by Next.js in
  // production — catch them here and return a real message (see initiatePayment
  // in src/actions/payment.ts for the same pattern and why).
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true },
    });
    if (!dbUser) return { error: "Account not found" };

    const externalReference = randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const nameParts = (dbUser.fullName ?? "").trim().split(/\s+/);
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const { paymentUrl, reference } = await campayInitiate({
      externalReference,
      amount: PREMIUM_PRICE_XAF,
      description: `Premium subscription (${PREMIUM_DURATION_DAYS} days)`,
      redirectUrl: `${baseUrl}/premium/return?ref=${externalReference}`,
      failureRedirectUrl: `${baseUrl}/premium/return?ref=${externalReference}`,
      firstName,
      lastName,
      email: dbUser.email ?? user.email ?? "",
    });

    await prisma.subscriptionPurchase.create({
      data: {
        userId: user.id,
        amountPaid: PREMIUM_PRICE_XAF,
        durationDays: PREMIUM_DURATION_DAYS,
        externalReference,
        campayReference: reference,
        status: "PENDING",
      },
    });

    return { paymentUrl };
  } catch (err) {
    console.error("[initiateSubscriptionPurchase]", err);
    return { error: err instanceof Error ? err.message : "Subscription purchase could not be initiated" };
  }
}
