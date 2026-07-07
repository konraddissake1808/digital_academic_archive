import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  if (!ref) {
    return <ReturnLayout status="error" message="Invalid payment link." />;
  }

  const purchase = await prisma.purchase.findUnique({
    where: { externalReference: ref },
    include: { resource: { select: { id: true, title: true } } },
  });

  if (!purchase) {
    return <ReturnLayout status="error" message="Payment record not found." />;
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

function ReturnLayout({
  status,
  message,
  children,
}: {
  status: "success" | "error" | "pending";
  message: string;
  children?: React.ReactNode;
}) {
  const icons = {
    success: (
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
    ),
    error: (
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    pending: (
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
        <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    ),
  };

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      {icons[status]}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {status === "success" ? "Payment Successful" : status === "pending" ? "Processing…" : "Payment Failed"}
      </h1>
      <p className="text-gray-600 mb-8">{message}</p>
      {children}
    </div>
  );
}
