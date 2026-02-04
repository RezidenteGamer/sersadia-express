import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://faciliteteste.lovable.app";

    // Create Checkout Pro preference (redirect flow)
    const preferenceData = {
      items: [
        {
          title: `Reserva - ${locationName}`,
          description: `${reservationDate} | ${timeSlot}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: amount,
        },
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${origin}/my-reservations?payment=success`,
        failure: `${origin}/my-reservations?payment=failure`,
        pending: `${origin}/my-reservations?payment=pending`,
      },
      auto_return: "approved",
      external_reference: reservationId,
      metadata: {
        reservation_id: reservationId,
        user_id: user.id,
      },
    };

    logStep("Creating Checkout preference", { amount, locationName });

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    const responseData = await mpResponse.json();

    if (!mpResponse.ok) {
      logStep("Mercado Pago API error", { status: mpResponse.status, error: responseData });
      throw new Error(`Mercado Pago API error: ${mpResponse.status} - ${JSON.stringify(responseData)}`);
    }

    logStep("Checkout preference created", { 
      preferenceId: responseData.id,
      initPoint: responseData.init_point,
      sandboxInitPoint: responseData.sandbox_init_point
    });

    return new Response(
      JSON.stringify({ 
        preferenceId: responseData.id,
        initPoint: responseData.init_point,
        sandboxInitPoint: responseData.sandbox_init_point,
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
