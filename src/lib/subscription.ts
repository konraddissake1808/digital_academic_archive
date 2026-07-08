import { prisma } from "@/lib/prisma";

export const PREMIUM_PRICE_XAF = 2000;
export const PREMIUM_DURATION_DAYS = 30;

export function isPremiumActive(user: { tier: string; premiumExpiresAt: Date | null }): boolean {
  if (user.tier !== "PREMIUM") return false;
  return !user.premiumExpiresAt || user.premiumExpiresAt > new Date();
}

// Extends from the current expiry if the user's premium is still active,
// otherwise starts a fresh period from now. Called once CamPay confirms
// payment for a SubscriptionPurchase.
export async function grantOrExtendPremium(userId: string, durationDays: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, premiumExpiresAt: true },
  });
  if (!user) return;

  const base = isPremiumActive(user) && user.premiumExpiresAt ? user.premiumExpiresAt : new Date();
  const newExpiry = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { tier: "PREMIUM", premiumExpiresAt: newExpiry },
  });
}
