const BASE =
  process.env.CAMPAY_ENVIRONMENT === "PROD"
    ? "https://www.campay.net"
    : "https://demo.campay.net";

interface TokenResponse {
  token: string;
}

interface PaymentLinkResponse {
  // CamPay's raw API returns just { link, reference } on success (HTTP 200)
  // and { message } on failure — there is no "status" field in the response body.
  link?: string;
  reference?: string;
  message?: string;
}

interface TransactionStatusResponse {
  reference: string;
  external_reference: string;
  status: string; // "PENDING" | "SUCCESSFUL" | "FAILED"
  amount: string;
  currency: string;
}

async function campayGetToken(): Promise<string> {
  const res = await fetch(`${BASE}/api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.CAMPAY_APP_USERNAME,
      password: process.env.CAMPAY_APP_PASSWORD,
    }),
  });

  const json: TokenResponse = await res.json();

  if (!res.ok || !json.token) {
    throw new Error("CamPay authentication failed — check CAMPAY_APP_USERNAME/CAMPAY_APP_PASSWORD");
  }

  return json.token;
}

export async function campayInitiate(opts: {
  externalReference: string;
  amount: number;
  description: string;
  redirectUrl: string;
  failureRedirectUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  currency?: string;
}): Promise<{ paymentUrl: string; reference: string }> {
  const token = await campayGetToken();

  const res = await fetch(`${BASE}/api/get_payment_link/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      amount: String(opts.amount),
      currency: opts.currency ?? "XAF",
      description: opts.description,
      external_reference: opts.externalReference,
      redirect_url: opts.redirectUrl,
      failure_redirect_url: opts.failureRedirectUrl,
      from: "",
      first_name: opts.firstName,
      last_name: opts.lastName,
      email: opts.email,
      payment_options: "MOMO,CARD",
    }),
  });

  const json: PaymentLinkResponse = await res.json();

  if (!res.ok || !json.link || !json.reference) {
    throw new Error(`CamPay init failed: ${json.message ?? "unknown error"}`);
  }

  return { paymentUrl: json.link, reference: json.reference };
}

export async function campayCheck(
  reference: string
): Promise<{ status: string; amount: number; currency: string }> {
  const token = await campayGetToken();

  const res = await fetch(`${BASE}/api/transaction/${reference}/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });

  const json: TransactionStatusResponse = await res.json();

  if (!res.ok) {
    throw new Error(`CamPay check failed: ${JSON.stringify(json)}`);
  }

  return {
    status: json.status,
    amount: Number(json.amount),
    currency: json.currency,
  };
}
