import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ReturnLayout } from "@/components/return-layout";
import { campayCheck } from "@/lib/campay";

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  if (!ref) {
    return <ReturnLayout status="error" message="Invalid payment link." />;
  }

  let purchase = await prisma.purchase.findUnique({
    where: { externalReference: ref },
    include: { resource: { select: { id: true, title: true } } },
  });

  if (!purchase) {
    return <ReturnLayout status="error" message="Payment record not found." />;
  }

  // Don't rely solely on the webhook — the user landing here right after
  // paying is a good moment to actively confirm status with CamPay in case
  // the webhook hasn't fired yet (or isn't configured at all).
  if (purchase.status === "PENDING" && purchase.campayReference) {
    try {
      const { status } = await campayCheck(purchase.campayReference);
      const newStatus =
        status === "SUCCESSFUL" ? "PAID" :
        status === "FAILED" ? "FAILED" :
        "PENDING";

      if (newStatus !== purchase.status) {
        purchase = await prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: newStatus },
          include: { resource: { select: { id: true, title: true } } },
        });
      }
    } catch (err) {
      console.error("[payment/return] status recheck failed", err);
    }
  }

  if (purchase.status === "PAID") {
    return (
      <ReturnLayout status="success" message={`You now have access to "${purchase.resource.title}".`}>
        <div className="flex gap-3 justify-center">
          <Link href={`/resources/${purchase.resource.id}`}>
            <Button>View Resource</Button>
          </Link>
          <Link href="/resources">
            <Button variant="secondary">Browse More</Button>
          </Link>
        </div>
      </ReturnLayout>
    );
  }

  if (purchase.status === "FAILED") {
    return (
      <ReturnLayout status="error" message="Payment was declined or cancelled.">
        <Link href={`/resources/${purchase.resource.id}`}>
          <Button variant="secondary">Try Again</Button>
        </Link>
      </ReturnLayout>
    );
  }

  // PENDING — payment may still be processing (webhook hasn't fired yet)
  return (
    <ReturnLayout status="pending" message="Your payment is being processed. Check back in a moment.">
      <Link href={`/resources/${purchase.resource.id}`}>
        <Button variant="secondary">Back to Resource</Button>
      </Link>
    </ReturnLayout>
  );
}
