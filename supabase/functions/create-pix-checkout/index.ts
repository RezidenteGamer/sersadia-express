import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PIX-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Get request body
    const { reservationId, amount, locationName, reservationDate, timeSlot } = await req.json();
    
    if (!reservationId || !amount) {
      throw new Error("Missing required fields: reservationId and amount");
    }
    logStep("Request data received", { reservationId, amount, locationName });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get Mercado Pago Access Token
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set");
    logStep("Mercado Pago credentials loaded");

    // Generate idempotency key to avoid duplicate payments
    const idempotencyKey = `${reservationId}-${Date.now()}`;

    // Create PIX payment using Mercado Pago Payments API
    const paymentData = {
      transaction_amount: amount,
      description: `Reserva - ${locationName} | ${reservationDate} | ${timeSlot}`,
      payment_method_id: "pix",
      payer: {
        email: user.email,
      },
      external_reference: reservationId,
      metadata: {
        reservation_id: reservationId,
        user_id: user.id,
      },
    };

    logStep("Creating PIX payment", { amount, description: paymentData.description });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    const responseData = await mpResponse.json();

    if (!mpResponse.ok) {
      logStep("Mercado Pago API error", { status: mpResponse.status, error: responseData });
      throw new Error(`Mercado Pago API error: ${mpResponse.status} - ${JSON.stringify(responseData)}`);
    }

    logStep("PIX payment created", { 
      paymentId: responseData.id, 
      status: responseData.status,
      hasQrCode: !!responseData.point_of_interaction?.transaction_data?.qr_code
    });

    // Extract PIX data
    const pixData = responseData.point_of_interaction?.transaction_data;
    
    if (!pixData) {
      throw new Error("PIX data not available in response");
    }

    return new Response(
      JSON.stringify({ 
        paymentId: responseData.id,
        status: responseData.status,
        qrCode: pixData.qr_code,
        qrCodeBase64: pixData.qr_code_base64,
        ticketUrl: pixData.ticket_url,
        expirationDate: responseData.date_of_expiration,
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
