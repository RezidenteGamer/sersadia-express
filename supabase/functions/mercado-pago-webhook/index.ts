import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MP-WEBHOOK] ${step}${detailsStr}`);
};

async function verifyMercadoPagoSignature(req: Request, dataId: string): Promise<boolean> {
  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');
  const secret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');

  if (!secret) {
    logStep("WARNING: MERCADO_PAGO_WEBHOOK_SECRET not set, skipping signature verification");
    return false;
  }

  if (!xSignature || !xRequestId) {
    logStep("Missing x-signature or x-request-id headers");
    return false;
  }

  const parts = xSignature.split(',');
  const ts = parts.find(p => p.trimStart().startsWith('ts='))?.split('=')[1];
  const hash = parts.find(p => p.trimStart().startsWith('v1='))?.split('=')[1];

  if (!ts || !hash) {
    logStep("Invalid x-signature format");
    return false;
  }

  // Mercado Pago manifest format: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const expectedHash = new TextDecoder().decode(hexEncode(new Uint8Array(signature)));

  return hash === expectedHash;
}

// --- Input Validation Schemas ---
const WebhookBodySchema = z.object({
  type: z.string().max(50).optional(),
  action: z.string().max(100).optional(),
  data: z.object({
    id: z.union([z.string().regex(/^\d+$/), z.number().positive()]),
  }),
});

const PaymentDataSchema = z.object({
  id: z.number().positive(),
  status: z.enum(['approved', 'pending', 'rejected', 'cancelled', 'refunded', 'in_process', 'charged_back', 'authorized']),
  external_reference: z.string().uuid().nullable().optional(),
  transaction_amount: z.number().positive().max(1000000),
  payment_method_id: z.string().max(100).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
      status: 200 
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Webhook received", { method: req.method });

    const bodyText = await req.text();
    let rawBody: unknown;
    try {
      rawBody = JSON.parse(bodyText);
    } catch {
      logStep("Invalid JSON body");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    // Validate webhook body schema
    const bodyResult = WebhookBodySchema.safeParse(rawBody);
    if (!bodyResult.success) {
      logStep("Invalid webhook body schema", { errors: bodyResult.error.issues });
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const body = bodyResult.data;
    logStep("Webhook body validated", { type: body.type, action: body.action, dataId: body.data.id });

    const dataId = String(body.data.id);
    const signatureValid = await verifyMercadoPagoSignature(req, dataId);
    if (!signatureValid) {
      logStep("Signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 403 });
    }
    logStep("Signature verified successfully");

    // We care about "payment" type notifications
    if (body.type !== "payment" && body.action !== "payment.updated" && body.action !== "payment.created") {
      logStep("Ignoring non-payment notification", { type: body.type, action: body.action });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const paymentId = dataId;

    // Fetch payment details from Mercado Pago
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not set");

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!mpResponse.ok) {
      logStep("Failed to fetch payment from MP", { status: mpResponse.status });
      return new Response(JSON.stringify({ error: "Failed to fetch payment" }), { status: 500 });
    }

    const rawPayment = await mpResponse.json();

    // Validate payment data from Mercado Pago API
    const paymentResult = PaymentDataSchema.safeParse(rawPayment);
    if (!paymentResult.success) {
      logStep("Invalid payment data from MP API", { errors: paymentResult.error.issues });
      return new Response(JSON.stringify({ error: "Invalid payment data" }), { status: 400 });
    }

    const payment = paymentResult.data;
    logStep("Payment details validated", { 
      id: payment.id, 
      status: payment.status, 
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount,
    });

    const reservationId = payment.external_reference;
    if (!reservationId) {
      logStep("No external_reference (reservation ID) in payment");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Verify reservation exists and is in pending status (idempotency + business logic)
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("id, user_id, code, status, total_price")
      .eq("id", reservationId)
      .maybeSingle();

    if (resError || !reservation) {
      logStep("Reservation not found", { reservationId, error: resError?.message });
      return new Response(JSON.stringify({ error: "Reservation not found" }), { status: 400 });
    }

    if (payment.status === "approved") {
      logStep("Payment approved, processing", { reservationId });

      // Check for duplicate payment (idempotency)
      const { data: existingPaidPayment } = await supabase
        .from("payments")
        .select("id, mp_payment_id")
        .eq("reservation_id", reservationId)
        .eq("is_paid", true)
        .maybeSingle();

      if (existingPaidPayment?.mp_payment_id === String(payment.id)) {
        logStep("Duplicate payment notification, skipping", { mp_payment_id: payment.id });
        return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 });
      }

      // Update or create payment record
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("reservation_id", reservationId)
        .maybeSingle();

      if (existingPayment) {
        await supabase
          .from("payments")
          .update({
            is_paid: true,
            paid_at: new Date().toISOString(),
            payment_method: "pix",
            mp_payment_id: String(payment.id),
          })
          .eq("id", existingPayment.id);
      } else {
        await supabase
          .from("payments")
          .insert({
            reservation_id: reservationId,
            amount: payment.transaction_amount,
            is_paid: true,
            paid_at: new Date().toISOString(),
            payment_method: "pix",
            mp_payment_id: String(payment.id),
          });
      }

      // Confirm the reservation automatically only if pending
      if (reservation.status === "pending") {
        const { error: updateError } = await supabase
          .from("reservations")
          .update({
            status: "confirmed",
            admin_notes: "Reserva confirmada automaticamente após pagamento via PIX.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", reservationId)
          .eq("status", "pending");

        if (updateError) {
          logStep("Error updating reservation", { error: updateError.message });
        } else {
          logStep("Reservation confirmed successfully");
        }
      }

      // Create a log entry
      await supabase.from("reservation_logs").insert({
        reservation_id: reservationId,
        action: "payment_confirmed",
        details: `Pagamento PIX confirmado automaticamente. MP Payment ID: ${payment.id}`,
      });

      // Send notification to user
      if (reservation.user_id) {
        await supabase.from("notifications").insert({
          user_id: reservation.user_id,
          title: "Pagamento confirmado!",
          message: `Seu pagamento para a reserva ${reservation.code} foi confirmado e a reserva foi aprovada automaticamente.`,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
