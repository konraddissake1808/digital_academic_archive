import { prisma } from "@/lib/prisma";
import { campayCheck } from "@/lib/campay";
import { grantOrExtendPremium } from "@/lib/subscription";

// CamPay sends a POST to the app's configured webhook URL when a payment status changes.
// We verify the status with CamPay rather than trusting the request body.
export async function POST(request: Request) {
  try {
    let campayReference: string | null = null;
    let externalReference: string | null = null;

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      campayReference = body.reference ?? null;
      externalReference = body.external_reference ?? null;
    } else {
      const form = await request.formData();
      campayReference = (form.get("reference") ?? null) as string | null;
      externalReference = (form.get("external_reference") ?? null) as string | null;
    }

    if (!campayReference && !externalReference) {
      return Response.json({ error: "Missing reference" }, { status: 400 });
    }

    const purchase = campayReference
      ? await prisma.purchase.findUnique({ where: { campayReference } })
      : await prisma.purchase.findUnique({ where: { externalReference: externalReference! } });

    if (purchase?.campayReference) {
      const { status } = await campayCheck(purchase.campayReference);
      const newStatus =
        status === "SUCCESSFUL" ? "PAID" :
        status === "FAILED" ? "FAILED" :
        "PENDING";

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: newStatus },
      });

      return Response.json({ ok: true });
    }

    const subscriptionPurchase = campayReference
      ? await prisma.subscriptionPurchase.findUnique({ where: { campayReference } })
      : await prisma.subscriptionPurchase.findUnique({ where: { externalReference: externalReference! } });

    if (!subscriptionPurchase?.campayReference) {
      return Response.json({ error: "Purchase not found" }, { status: 404 });
    }

    const { status } = await campayCheck(subscriptionPurchase.campayReference);
    const newStatus =
      status === "SUCCESSFUL" ? "PAID" :
      status === "FAILED" ? "FAILED" :
      "PENDING";

    await prisma.subscriptionPurchase.update({
      where: { id: subscriptionPurchase.id },
      data: { status: newStatus },
    });

    if (newStatus === "PAID") {
      await grantOrExtendPremium(subscriptionPurchase.userId, subscriptionPurchase.durationDays);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[campay/notify]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
