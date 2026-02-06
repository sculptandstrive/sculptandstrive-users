import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


const LOCAL_JSON_URL = "https://zoxqjjuokxiyxusqapvv.supabase.co/storage/v1/object/public/assets/indian_foods.json?t=" + Date.now();
const USDA_API_KEY = Deno.env.get("USDA_API_KEY") || "7tq13Cf3Lfxmi497a6Hfnyyq58wB1Gy77XwnT5pP";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || body.searchTerm;
    
    if (!query) return new Response(JSON.stringify({ foods: [] }), { headers: corsHeaders });

    const cleanQuery = query.toLowerCase().trim();

    
    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(cleanQuery)}&dataType=Foundation,SR%20Legacy&pageSize=5`;
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=20&lc=en&fields=code,product_name,product_name_en,brands,image_small_url,nutriments,categories_tags`;

    const [usdaRes, offRes, localRes] = await Promise.all([
      fetch(usdaUrl).then(r => r.ok ? r.json() : { foods: [] }).catch(() => ({ foods: [] })),
      fetch(offUrl).then(r => r.ok ? r.json() : { products: [] }).catch(() => ({ products: [] })),
      fetch(LOCAL_JSON_URL, { cache: 'no-cache' })
        .then(async (r) => {
          if (!r.ok) throw new Error(`Storage error: ${r.status}`);
          return await r.json();
        })
        .catch((e) => {
          console.error("Local Fetch Failed:", e);
          return [];
        })
    ]);

    // Local Indian Gym Foods 
    const localFoods = (Array.isArray(localRes) ? localRes : [])
      .filter((f: any) => 
        f.name.toLowerCase().includes(cleanQuery) || 
        f.brand?.toLowerCase().includes(cleanQuery)
      )
      .map((f: any) => ({
        ...f,
        id: `local-${f.id}`,
        score: 110 
      }));

    //  USDA Results
    const usdaFoods = (usdaRes.foods || []).map((food: any) => {
      const getNut = (id: number) => food.foodNutrients?.find((n: any) => n.nutrientId === id)?.value || 0;
      return {
        id: `usda-${food.fdcId}`,
        name: food.description.toUpperCase(),
        brand: "Whole Food",
        image: "https://cdn-icons-png.flaticon.com/512/706/706164.png",
        calories: Math.round(getNut(1008)),
        protein: Math.round(getNut(1003) * 10) / 10,
        carbs: Math.round(getNut(1005) * 10) / 10,
        fats: Math.round(getNut(1004) * 10) / 10,
        score: food.description.toLowerCase().includes(cleanQuery) ? 100 : 50
      };
    });

    // Process OFF Results
    const offFoods = (offRes.products || [])
      .filter((p: any) => (p.product_name || p.product_name_en) && p.nutriments?.['energy-kcal_100g'])
      .map((p: any) => ({
        id: `off-${p.code}`,
        name: p.product_name_en || p.product_name,
        brand: p.brands || "Branded",
        image: p.image_small_url || "https://cdn-icons-png.flaticon.com/512/706/706164.png",
        calories: Math.round(p.nutriments['energy-kcal_100g']),
        protein: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
        fats: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
        score: 10
      }));

    const combinedFoods = [...localFoods, ...usdaFoods, ...offFoods].sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({ foods: combinedFoods.slice(0, 15) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ foods: [], error: error.message }), { 
      status: 200, 
      headers: corsHeaders 
    });
  }
});