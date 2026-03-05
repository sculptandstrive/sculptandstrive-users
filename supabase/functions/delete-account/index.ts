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

    // Identify user from session
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("User session not found");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const uid = user.id;

    // Updated Table configurations
    const tableConfigs = [
      { name: "user_roles", key: "user_id" },
      { name: "progress_records", key: "user_id" },
      { name: "progress_photos", key: "user_id" },
      { name: "user_meal_plans", key: "user_id" },
      { name: "nutrition_logs", key: "user_id" },
      { name: "water_intake", key: "user_id" },
      { name: "workouts", key: "user_id" },
      { name: "starting_measurements", key: "user_id" },
      { name: "current_measurements", key: "user_id" },
      { name: "profile_details", key: "user_id" },
      { name: "activities", key: "id" }, 
      { name: "profiles", key: "id" }
    ];

    console.log(`Starting full wipe for user: ${uid}`);

    // Delete user data from all specified tables
    for (const table of tableConfigs) {
      const { error } = await adminClient
        .from(table.name)
        .delete()
        .eq(table.key, uid);

      if (error) {
        // If 'id' also fails for activities, log it but don't stop the process
        console.warn(`Could not clear ${table.name}: ${error.message}`);
      } else {
        console.log(`Successfully cleared ${table.name}`);
      }
    }

    // Clear storage (Progress Photos)
    const { error: storageError } = await adminClient.storage
      .from('progress_photos')
      .remove([`${uid}`]);
    
    if (storageError) console.warn("Storage cleanup warning:", storageError.message);

    //  Delete the Auth account
    const { error: authError } = await adminClient.auth.admin.deleteUser(uid);
    if (authError) throw authError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Critical error during account deletion:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});