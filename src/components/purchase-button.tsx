"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { initiatePayment } from "@/actions/payment";

export function PurchaseButton({ resourceId }: { resourceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const result = await initiatePayment(resourceId);
      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }
      window.location.href = result.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be initiated");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button size="lg" onClick={handleClick} disabled={loading} className="w-full sm:w-auto">
        {loading ? "Redirecting to payment…" : "Purchase — Pay with Orange Money / MTN"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
