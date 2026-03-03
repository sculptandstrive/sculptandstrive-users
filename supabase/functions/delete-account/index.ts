import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    //  Identify user from  session
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("User session not found");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const uid = user.id;

    //  List 
    const tables = [
      "user_roles",           // Roles like 'trial_user' seen in your screenshot
      "progress_records",      // Weight and progress tracking
      "progress_photos",       // References to photos
      "user_meal_plans",       // Nutrition section
      "nutrition_logs",        // Daily food logs
      "water_intake",          // Hydration tracking
      "workouts",              // Fitness section
      "activities",            // Dashboard activity feed
      "starting_measurements", // Initial body data
      "current_measurements",  // Current body data
      "profile_details",       // User settings
      "profiles"               // Main profile link
    ];

    console.log(`Starting full wipe for user: ${uid}`);

    //  Delete from all tables automatically
    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq("user_id", uid);
      if (error) console.warn(`Could not clear ${table}:`, error.message);
    }

    //  Clear storage (Progress Photos)
  
    await adminClient.storage.from('progress_photos').remove([`${uid}`]);

    //  Delete the Auth account
    const { error: authError } = await adminClient.auth.admin.deleteUser(uid);
    if (authError) throw authError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});