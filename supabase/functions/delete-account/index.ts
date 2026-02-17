import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  //  CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    //  Safe auth header check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: corsHeaders },
      );
    }

    //  Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    //  User-scoped client
    const userClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("ANON_KEY")!, // Match the new secret name here
  { global: { headers: { Authorization: authHeader } } },
);

    // Verify user
    const {
      data: { user },
      error,
    } = await userClient.auth.getUser();

    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = user.id;

    // Delete avatar files
    const { data: files } = await supabaseAdmin.storage
      .from("user-images")
      .list(`avatars/${userId}`); // FIXED: Changed from .list` to .list(`

    if (files?.length) {
      await supabaseAdmin.storage
        .from("user-images")
        .remove(files.map((f) => `avatars/${userId}/${f.name}`));
    }

    // Delete all user data
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);
    await supabaseAdmin.from("progress_photos").delete().eq("user_id", userId);
    await supabaseAdmin.from("nutrition_logs").delete().eq("user_id", userId);
    await supabaseAdmin.from("water_intake").delete().eq("user_id", userId);
    await supabaseAdmin.from("profile_details").delete().eq("user_id", userId);
    await supabaseAdmin
      .from("notification_preferences")
      .delete()
      .eq("user_id", userId);

    //  Delete auth user LAST
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
<<<<<<< HEAD
});
=======
});
>>>>>>> 41599d0f417d519778569b26b879b8aef22d507e
