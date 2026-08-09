import { useEffect, useRef, useState } from "react";

const GOOGLE_PAY_ENVIRONMENT = "TEST";
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_XXXXXXXXXXXXXXXXXXXXXXXX";
const CHARGE_ENDPOINT = "/api/payments/google-pay-subscription";

const baseCardPaymentMethod = {
  type: "CARD",
  parameters: {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"],
  },
};

const cardPaymentMethod = {
  ...baseCardPaymentMethod,
  tokenizationSpecification: {
    type: "PAYMENT_GATEWAY",
    parameters: {
      gateway: "stripe",
      "stripe:version": "2024-06-20",
      "stripe:publishableKey": STRIPE_PUBLISHABLE_KEY,
    },
  },
};

type SubscriptionPlan = {
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
};

type GooglePayButtonProps = {
  plan: SubscriptionPlan;
  userEmail?: string;
  onSuccess: (receipt: any) => void;
  onError: (error: Error) => void;
};

declare global {
  interface Window {
    google?: any;
  }
}

function getGooglePaymentsClient() {
  return new window.google.payments.api.PaymentsClient({
    environment: GOOGLE_PAY_ENVIRONMENT,
  });
}

function buildPaymentDataRequest(plan: SubscriptionPlan) {
  const totalPrice = (plan.priceCents / 100).toFixed(2);

  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [cardPaymentMethod],
    merchantInfo: {
      merchantId: import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID || "12345678901234567890",
      merchantName: "Neuro NetWorks",
    },
    transactionInfo: {
      countryCode: "ZA",
      currencyCode: plan.currency,
      totalPriceStatus: "FINAL",
      totalPrice,
      totalPriceLabel: `${plan.name} first month`,
      displayItems: [
        {
          label: `${plan.name} (${plan.interval})`,
          type: "LINE_ITEM",
          price: totalPrice,
        },
      ],
    },
    shippingAddressRequired: false,
    emailRequired: true,
  };
}

export default function GooglePayButton({ plan, userEmail, onSuccess, onError }: GooglePayButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function init() {
      const paymentsClient = getGooglePaymentsClient();

      paymentsClient
        .isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [baseCardPaymentMethod],
        })
        .then((response: any) => {
          if (cancelled || !response.result) return;

          const button = paymentsClient.createButton({
            onClick: () => handleClick(paymentsClient),
            buttonColor: "black",
            buttonType: "subscribe",
            buttonSizeMode: "fill",
            buttonRadius: 8,
          });

          containerRef.current?.replaceChildren(button);
          setReady(true);
        })
        .catch((err: Error) => onError?.(err));
    }

    if (window.google?.payments?.api) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://pay.google.com/gp/p/js/pay.js";
      script.async = true;
      script.onload = init;
      script.onerror = () => onError?.(new Error("Failed to load Google Pay script"));
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClick(paymentsClient: any) {
    setLoadingPay(true);
    try {
      const paymentDataRequest = buildPaymentDataRequest(plan);
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      const googlePayToken = paymentData.paymentMethodData.tokenizationData.token;
      const payerEmail = paymentData.email || userEmail;

      const res = await fetch(CHARGE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googlePayToken,
          payerEmail,
          planName: plan.name,
          amountCents: plan.priceCents,
          currency: plan.currency,
          interval: plan.interval,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Google Pay subscription failed. Please try again.");
      }

      onSuccess(await res.json());
    } catch (err: any) {
      if (err?.statusCode !== "CANCELED") {
        onError?.(err);
      }
    } finally {
      setLoadingPay(false);
    }
  }

  return (
    <div>
      <div
        ref={containerRef}
        style={{ minHeight: 48, margin: "8px 0", opacity: loadingPay ? 0.6 : 1 }}
        aria-live="polite"
      />
      {!ready && <p className="text-xs text-white/40">Loading Google Pay…</p>}
    </div>
  );
}
