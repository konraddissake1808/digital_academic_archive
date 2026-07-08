import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ReturnLayout } from "@/components/return-layout";

export default async function PremiumReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  if (!ref) {
    return <ReturnLayout status="error" message="Invalid payment link." />;
  }

  const purchase = await prisma.subscriptionPurchase.findUnique({
    where: { externalReference: ref },
  });

  if (!purchase) {
    return <ReturnLayout status="error" message="Payment record not found." />;
  }

  if (purchase.status === "PAID") {
    return (
      <ReturnLayout status="success" message="You're now Premium — enjoy unlimited downloads.">
        <div className="flex gap-3 justify-center">
          <Link href="/premium">
            <Button>View Premium Status</Button>
          </Link>
          <Link href="/resources">
            <Button variant="secondary">Browse Resources</Button>
          </Link>
        </div>
      </ReturnLayout>
    );
  }

  if (purchase.status === "FAILED") {
    return (
      <ReturnLayout status="error" message="Payment was declined or cancelled.">
        <Link href="/premium">
          <Button variant="secondary">Try Again</Button>
        </Link>
      </ReturnLayout>
    );
  }

  // PENDING — payment may still be processing (webhook hasn't fired yet)
  return (
    <ReturnLayout status="pending" message="Your payment is being processed. Check back in a moment.">
      <Link href="/premium">
        <Button variant="secondary">Back to Premium</Button>
      </Link>
    </ReturnLayout>
  );
}
