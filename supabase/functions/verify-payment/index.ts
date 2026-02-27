import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 
};

export const config = {
  verify_jwt: false,
};

serve(async(req)=>{
  if(req.method === 'OPTIONS'){
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      user_id,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !amount ||
      !user_id
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keySecret) {
      throw new Error("Missing Razorpay Secret");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(keySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body),
    );

    const generatedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (generatedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase.from("payments").insert({
      user_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      status: "success",
    });

    const {data: userData, error: userError} = await supabase.auth.admin.getUserById(user_id);

    if(userError || !userData.user){
      throw new Error('User not found');
    }

    const currentRole = userData.user.user_metadata?.plan_role;
    const currentExpiry = userData.user.user_metadata?.expiry_at;

    let newExpiry: Date;
    const now = new Date();

    if(currentRole === 'trial_user'){
      newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 29);
    }
    else if (currentExpiry && new Date(currentExpiry) > now){
      newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + 29);
    }
    else{
       newExpiry = new Date();
       newExpiry.setDate(newExpiry.getDate() + 29);
    }
  
    await supabase.auth.admin.updateUserById(user_id, {
      user_metadata: {
        ...userData.user.user_metadata,
        plan_role: "user",
        expiry_at: newExpiry.toISOString(),
        signup_source: "user",
      },
    });

    await supabase.from('user_roles').update({role: 'user', expiry_time: newExpiry.toISOString()}).eq('user_id', user_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
