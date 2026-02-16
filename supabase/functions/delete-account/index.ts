import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Function 'delete-account' invoked...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.error("No Authorization header provided.");
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 2. Initialize Clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Use the service key or anon key to verify the user via the header
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 3. Verify User Identity
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error("User verification failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError?.message }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = user.id;
    console.log(`Verified user ID: ${userId}. Starting cleanup...`);

    // 4. Delete Storage Files (Avatars)
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from("user-images")
      .list(`avatars/${userId}`);

    if (listError) {
      console.warn("Could not list storage files:", listError.message);
    } else if (files && files.length > 0) {
      const pathsToDelete = files.map((f) => `avatars/${userId}/${f.name}`);
      const { error: storageErr } = await supabaseAdmin.storage
        .from("user-images")
        .remove(pathsToDelete);
      
      if (storageErr) console.error("Storage deletion error:", storageErr.message);
      else console.log(`Deleted ${files.length} files from storage.`);
    }

    // 5. Delete Database Records
    // NOTE: Ensure your table columns are actually named "user_id"
    const tables = [
      "profiles", 
      "progress_photos", 
      "nutrition_logs", 
      "water_intake", 
      "profile_details", 
      "notification_preferences"
    ];

    for (const table of tables) {
      const { error: dbErr } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("user_id", userId);
      
      if (dbErr) {
        console.error(`Error deleting from ${table}:`, dbErr.message);
      } else {
        console.log(`Cleaned table: ${table}`);
      }
    }

    // 6. Delete Auth User (The final step)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      throw new Error(`Auth deletion failed: ${deleteUserError.message}`);
    }

    console.log("Account successfully deleted for user:", userId);

    return new Response(JSON.stringify({ success: true, message: "Account deleted" }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Global catch error:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});