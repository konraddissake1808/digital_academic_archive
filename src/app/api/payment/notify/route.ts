import { prisma } from "@/lib/prisma";
import { cinetpayCheck } from "@/lib/cinetpay";

// CinetPay sends a POST to this URL when a payment status changes.
// We verify the status with CinetPay rather than trusting the request body.
export async function POST(request: Request) {
  try {
    // CinetPay may send JSON or form-encoded data depending on the account config
    let transactionId: string | null = null;

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      transactionId = body.cpm_trans_id ?? body.transaction_id ?? null;
    } else {
      const form = await request.formData();
      transactionId = (form.get("cpm_trans_id") ?? form.get("transaction_id") ?? null) as string | null;
    }

    if (!transactionId) {
      return Response.json({ error: "Missing transaction_id" }, { status: 400 });
    }

    const { status } = await cinetpayCheck(transactionId);

    const newStatus =
      status === "ACCEPTED" ? "PAID" :
      status === "REFUSED" || status === "CANCELLED" ? "FAILED" :
      "PENDING";

    await prisma.purchase.updateMany({
      where: { cinetpayTransactionId: transactionId },
      data: { status: newStatus },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[cinetpay/notify]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
