import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REFUND] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Refund request received");

    // Authenticate - must be admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: authData } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = authData.user;
    if (!user) throw new Error("Not authenticated");

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) throw new Error("Unauthorized: admin only");

    const { reservationId } = await req.json();
    if (!reservationId) throw new Error("Missing reservationId");

    logStep("Processing refund", { reservationId, adminId: user.id });

    // Find the payment with MP payment ID
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reservation_id", reservationId)
      .eq("is_paid", true)
      .maybeSingle();

    if (paymentError) throw new Error(`Payment lookup error: ${paymentError.message}`);
    if (!payment) {
      logStep("No paid payment found, skipping refund");
      return new Response(JSON.stringify({ refunded: false, reason: "no_payment" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payment.mp_payment_id) {
      logStep("No MP payment ID, cannot refund automatically");
      return new Response(JSON.stringify({ refunded: false, reason: "no_mp_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Request refund from Mercado Pago
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not set");

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment.mp_payment_id}/refunds`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    const refundData = await mpResponse.json();
    logStep("Mercado Pago refund response", { status: mpResponse.status, data: refundData });

    if (!mpResponse.ok) {
      throw new Error(`Refund failed: ${JSON.stringify(refundData)}`);
    }

    // Update payment record
    await supabase
      .from("payments")
      .update({
        notes: `Reembolso realizado. Refund ID: ${refundData.id}`,
      })
      .eq("id", payment.id);

    // Log the refund
    await supabase.from("reservation_logs").insert({
      reservation_id: reservationId,
      admin_id: user.id,
      action: "payment_refunded",
      details: `Reembolso processado via Mercado Pago. Refund ID: ${refundData.id}`,
    });

    // Notify user
    const { data: reservation } = await supabase
      .from("reservations")
      .select("user_id, code")
      .eq("id", reservationId)
      .maybeSingle();

    if (reservation) {
      await supabase.from("notifications").insert({
        user_id: reservation.user_id,
        title: "Reembolso processado",
        message: `O reembolso da reserva ${reservation.code} foi processado. O valor será devolvido em breve.`,
      });
    }

    logStep("Refund completed successfully");

    return new Response(JSON.stringify({ refunded: true, refundId: refundData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
