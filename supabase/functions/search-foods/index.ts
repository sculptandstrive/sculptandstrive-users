import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOCAL_JSON_URL = "https://zoxqjjuokxiyxusqapvv.supabase.co/storage/v1/object/public/assets/indian_foods.json";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 1. Retrieve the updated secrets
  const appId = Deno.env.get("EDAMAM_APP_ID");
  const appKey = Deno.env.get("EDAMAM_APP_KEY");

  try {
    const { query } = await req.json();
    const cleanQuery = query?.toLowerCase().trim();
    if (!cleanQuery) return new Response(JSON.stringify({ foods: [] }), { headers: corsHeaders });

    //  Local Indian Foods + Edamam API
    const [localRes, edamamRes] = await Promise.allSettled([
      fetch(`${LOCAL_JSON_URL}?t=${Date.now()}`).then(r => r.json()),
      fetch(`https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(cleanQuery)}`)
        .then(async r => {
          if (!r.ok) {
            const err = await r.json();
            throw new Error(`Edamam Error ${r.status}: ${err.message || 'Unauthorized'}`);
          }
          return r.json();
        })
    ]);

    // 3. Process Local Results
    const localFoods = (localRes.status === 'fulfilled' ? localRes.value : [])
      .filter((f: any) => f.name.toLowerCase().includes(cleanQuery))
      .map((f: any) => ({ ...f, id: `local-${f.id}`, score: 200 }));

    // 4. Process API Results
    let apiFoods = [];
    if (edamamRes.status === 'fulfilled') {
      apiFoods = (edamamRes.value.hints || []).map((h: any) => ({
        id: `edamam-${h.food.foodId}`,
        name: h.food.label.toUpperCase(),
        brand: h.food.brand || "Standard Reference",
        calories: Math.round(h.food.nutrients.ENERC_KCAL || 0),
        protein: parseFloat((h.food.nutrients.PROCNT || 0).toFixed(1)),
        carbs: parseFloat((h.food.nutrients.CHOCDF || 0).toFixed(1)),
        fats: parseFloat((h.food.nutrients.FAT || 0).toFixed(1)),
        score: 100
      }));
    }

    const combined = [...localFoods, ...apiFoods].sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({ foods: combined.slice(0, 25) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: "Search failed", details: error.message }), { 
      headers: corsHeaders,
      status: 500
    });
  }
});