import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MP-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Webhook doesn't need CORS since it's called by Mercado Pago servers
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

    const body = await req.json();
    logStep("Webhook body", body);

    // Mercado Pago sends different notification types
    // We care about "payment" type notifications
    if (body.type !== "payment" && body.action !== "payment.updated" && body.action !== "payment.created") {
      logStep("Ignoring non-payment notification", { type: body.type, action: body.action });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logStep("No payment ID in notification");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

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

    const payment = await mpResponse.json();
    logStep("Payment details", { 
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

    if (payment.status === "approved") {
      logStep("Payment approved, confirming reservation", { reservationId });

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

      // Confirm the reservation automatically
      const { error: updateError } = await supabase
        .from("reservations")
        .update({
          status: "confirmed",
          admin_notes: "Reserva confirmada automaticamente após pagamento via PIX.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservationId)
        .in("status", ["pending"]); // Only auto-confirm if still pending

      if (updateError) {
        logStep("Error updating reservation", { error: updateError.message });
      } else {
        logStep("Reservation confirmed successfully");
      }

      // Create a log entry
      await supabase.from("reservation_logs").insert({
        reservation_id: reservationId,
        action: "payment_confirmed",
        details: `Pagamento PIX confirmado automaticamente. MP Payment ID: ${payment.id}`,
      });

      // Send notification to user
      const { data: reservation } = await supabase
        .from("reservations")
        .select("user_id, code")
        .eq("id", reservationId)
        .maybeSingle();

      if (reservation) {
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
