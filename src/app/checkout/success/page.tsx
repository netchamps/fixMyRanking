"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

type StatusState = {
  state: "loading" | "success" | "error";
  title: string;
  description: string;
};

const initialState: StatusState = {
  state: "loading",
  title: "Zahlung wird geprüft",
  description: "Bitte einen Moment warten, wir prüfen den Zahlungsstatus.",
};

function StatusCard({ status }: { status: StatusState }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mb-6 flex justify-center">
        {status.state === "loading" && (
          <LoaderCircle className="h-12 w-12 animate-spin text-emerald-600" />
        )}
        {status.state === "success" && <CheckCircle2 className="h-12 w-12 text-emerald-600" />}
        {status.state === "error" && <AlertCircle className="h-12 w-12 text-red-600" />}
      </div>

      <h1 className="mb-3 text-3xl font-bold text-slate-900">{status.title}</h1>
      <p className="mx-auto mb-8 max-w-xl text-slate-600">{status.description}</p>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Zur Startseite
        </Link>
        <Link
          href="/pro"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Pakete ansehen
        </Link>
      </div>
    </section>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusState>(initialState);

  const provider = useMemo(
    () => (searchParams.get("provider") || "").toLowerCase(),
    [searchParams],
  );
  const stripeSessionId = useMemo(
    () => searchParams.get("session_id") || "",
    [searchParams],
  );
  const paypalOrderId = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    let isCancelled = false;

    const verifyPayment = async () => {
      try {
        if (provider === "stripe") {
          if (!stripeSessionId) {
            throw new Error("Stripe Session-ID fehlt.");
          }

          const response = await fetch(
            `/api/payments/stripe/session?sessionId=${encodeURIComponent(stripeSessionId)}`,
            {
              cache: "no-store",
            },
          );

          const payload = (await response.json().catch(() => null)) as
            | {
                paid?: boolean;
                error?: string;
              }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error || "Stripe-Zahlung konnte nicht geprüft werden.");
          }

          if (!payload?.paid) {
            throw new Error("Stripe meldet die Zahlung noch nicht als bezahlt.");
          }

          if (!isCancelled) {
            setStatus({
              state: "success",
              title: "Zahlung erfolgreich",
              description:
                "Deine Stripe-Zahlung wurde bestätigt. Wir starten jetzt die Optimierung.",
            });
          }

          return;
        }

        if (provider === "paypal") {
          if (!paypalOrderId) {
            throw new Error("PayPal Order-ID fehlt.");
          }

          const response = await fetch("/api/payments/paypal/capture", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: paypalOrderId,
            }),
          });

          const payload = (await response.json().catch(() => null)) as
            | {
                captured?: boolean;
                error?: string;
              }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error || "PayPal-Zahlung konnte nicht abgeschlossen werden.");
          }

          if (!payload?.captured) {
            throw new Error("PayPal meldet die Zahlung noch nicht als abgeschlossen.");
          }

          if (!isCancelled) {
            setStatus({
              state: "success",
              title: "Zahlung erfolgreich",
              description:
                "Deine PayPal-Zahlung wurde abgeschlossen. Wir starten jetzt die Optimierung.",
            });
          }

          return;
        }

        if (!isCancelled) {
          setStatus({
            state: "success",
            title: "Danke für deine Buchung",
            description: "Wir haben deine Bestellung erhalten und melden uns per E-Mail.",
          });
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Die Zahlung konnte nicht verifiziert werden.";

        setStatus({
          state: "error",
          title: "Zahlung konnte nicht bestätigt werden",
          description: message,
        });
      }
    };

    void verifyPayment();

    return () => {
      isCancelled = true;
    };
  }, [provider, stripeSessionId, paypalOrderId]);

  return <StatusCard status={status} />;
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />

      <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pt-28 pb-16">
        <Suspense fallback={<StatusCard status={initialState} />}>
          <CheckoutSuccessContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
