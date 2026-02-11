import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// custom Indian foods list
const LOCAL_JSON_URL = "https://zoxqjjuokxiyxusqapvv.supabase.co/storage/v1/object/public/assets/indian_foods.json?t=" + Date.now();

//  RapidAPI Key ( this in Supabase Secrets)
const RAPID_API_KEY = Deno.env.get("RAPIDAPI_KEY");

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) return new Response(JSON.stringify({ foods: [] }), { headers: corsHeaders });

    const cleanQuery = query.toLowerCase().trim();

    //  Fetch Local Indian Foods 
    const localRes = await fetch(LOCAL_JSON_URL, { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    const localFoods = (Array.isArray(localRes) ? localRes : [])
      .filter((f: any) => f.name.toLowerCase().includes(cleanQuery))
      .map((f: any) => ({ ...f, id: `local-${f.id}`, score: 200 }));

    //  Fetch from RapidAPI 
    let apiFoods = [];
    if (RAPID_API_KEY) {
      const apiRes = await fetch(`https://calorieninjas.p.rapidapi.com/v1/nutrition?query=${encodeURIComponent(cleanQuery)}`, {
        method: "GET",
        headers: {
          'X-RapidAPI-Key': RAPID_API_KEY,
          'X-RapidAPI-Host': 'calorieninjas.p.rapidapi.com'
        }
      });

      const apiData = await apiRes.json();
      
      // Map RapidAPI response to application's expected format
      apiFoods = (apiData.items || []).map((f: any) => ({
        id: `rapid-${f.name}-${Date.now()}`,
        name: f.name.toUpperCase(),
        brand: "Whole Food",
        calories: Math.round(f.calories),
        protein: f.protein_g,
        carbs: f.carbohydrates_total_g,
        fats: f.fat_total_g,
        score: 100
      }));
    }

    // 3. Merge and Sort by  score system
    const combined = [...localFoods, ...apiFoods].sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({ foods: combined.slice(0, 15) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ foods: [] }), { headers: corsHeaders });
  }
});