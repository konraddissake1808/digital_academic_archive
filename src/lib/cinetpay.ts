const BASE = "https://api-checkout.cinetpay.com/v2";

interface InitResponse {
  code: string;
  message: string;
  data?: { payment_token: string; payment_url: string };
}

interface CheckResponse {
  code: string;
  message: string;
  data?: {
    amount: number;
    currency: string;
    status: string; // "ACCEPTED" | "REFUSED" | "PENDING" | "CANCELLED"
  };
}

export async function cinetpayInitiate(opts: {
  transactionId: string;
  amount: number;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  customerId: string;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  currency?: string;
}): Promise<string> {
  const res = await fetch(`${BASE}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: opts.transactionId,
      amount: opts.amount,
      currency: opts.currency ?? "XAF",
      description: opts.description,
      return_url: opts.returnUrl,
      notify_url: opts.notifyUrl,
      customer_id: opts.customerId,
      customer_name: opts.customerName,
      customer_surname: opts.customerSurname,
      customer_email: opts.customerEmail,
      channels: "ALL",
    }),
  });

  const json: InitResponse = await res.json();

  if (json.code !== "201" || !json.data?.payment_url) {
    throw new Error(`CinetPay init failed: ${json.message}`);
  }

  return json.data.payment_url;
}

export async function cinetpayCheck(
  transactionId: string
): Promise<{ status: string; amount: number; currency: string }> {
  const res = await fetch(`${BASE}/payment/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
    }),
  });

  const json: CheckResponse = await res.json();

  if (!json.data) {
    throw new Error(`CinetPay check failed: ${json.message}`);
  }

  return {
    status: json.data.status,
    amount: json.data.amount,
    currency: json.data.currency,
  };
}
