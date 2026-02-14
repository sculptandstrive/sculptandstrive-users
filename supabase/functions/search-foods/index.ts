import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const cleanQuery = query?.toLowerCase().trim();

    if (!cleanQuery) {
      return new Response(JSON.stringify({ foods: [] }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const appId = Deno.env.get("EDAMAM_APP_ID");
    const appKey = Deno.env.get("EDAMAM_APP_KEY");

    //  URL 
    const apiUrl = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(cleanQuery)}`;

    // Fetch with error handling
    const response = await fetch(apiUrl);
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType?.includes("application/json")) {
      const errorText = await response.text();
      console.error("Edamam API returned non-JSON response:", errorText.substring(0, 100));
      throw new Error(`API Error: ${response.status}. Check your API keys and Search term.`);
    }

    const data = await response.json();
    const apiFoods = (data.hints || []).map((h: any) => ({
      id: `edamam-${h.food.foodId}`,
      name: h.food.label.toUpperCase(),
      brand: h.food.brand || "Standard Reference",
      calories: Math.round(h.food.nutrients.ENERC_KCAL || 0),
      protein: parseFloat((h.food.nutrients.PROCNT || 0).toFixed(1)),
      carbs: parseFloat((h.food.nutrients.CHOCDF || 0).toFixed(1)),
      fats: parseFloat((h.food.nutrients.FAT || 0).toFixed(1)),
    }));

    return new Response(JSON.stringify({ foods: apiFoods }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ 
      error: "Search failed", 
      details: error.message,
      foods: [] 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });
  }
});