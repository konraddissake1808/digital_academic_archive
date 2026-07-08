import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "@/components/subscribe-button";
import { formatPrice } from "@/lib/utils";
import { PREMIUM_PRICE_XAF, PREMIUM_DURATION_DAYS, isPremiumActive } from "@/lib/subscription";

export const metadata = {
  title: "Premium — AcademicArchive",
};

const benefits = [
  "Unlimited downloads — no weekly cap on free resources",
  "Every paid resource included — no per-document purchases",
  "Support the publishers who write and share these materials",
];

export default async function PremiumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { tier: true, premiumExpiresAt: true },
      })
    : null;

  const isPremium = !!dbUser && isPremiumActive(dbUser);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Go Premium</h1>
        <p className="text-gray-600">
          Unlimited access to every resource on AcademicArchive, free or paid.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-gray-700">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(PREMIUM_PRICE_XAF)}
              <span className="text-base font-normal text-gray-500"> / {PREMIUM_DURATION_DAYS} days</span>
            </p>

            <div className="mt-6 flex justify-center">
              {isPremium && dbUser?.premiumExpiresAt ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    You&apos;re Premium until{" "}
                    <span className="font-medium text-gray-900">
                      {dbUser.premiumExpiresAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    .
                  </p>
                  <SubscribeButton />
                  <p className="mt-2 text-xs text-gray-400">
                    Subscribing again extends your current period.
                  </p>
                </div>
              ) : isPremium ? (
                <p className="text-sm text-gray-600">
                  You have permanent Premium access. Enjoy!
                </p>
              ) : user ? (
                <SubscribeButton />
              ) : (
                <Link href="/login?next=/premium">
                  <Button size="lg">Sign in to Subscribe</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
