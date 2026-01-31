import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ foods: [], error: 'Query must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for foods: ${query}`);

    // Search Open Food Facts API
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SculptAndStrive/1.0 - Fitness App',
      },
    });

    if (!response.ok) {
      console.error(`Open Food Facts API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform and filter results
    const foods = (data.products || [])
      .filter((product: any) => product.product_name && product.nutriments)
      .slice(0, 15)
      .map((product: any) => {
        const nutriments = product.nutriments || {};
        return {
          id: product.code || product._id,
          name: product.product_name,
          brand: product.brands || '',
          image: product.image_small_url || product.image_url || null,
          serving_size: product.serving_size || '100g',
          calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
          protein: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10,
          carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10,
          fats: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
          fiber: Math.round((nutriments.fiber_100g || nutriments.fiber || 0) * 10) / 10,
        };
      });

    console.log(`Found ${foods.length} foods for query: ${query}`);

    return new Response(
      JSON.stringify({ foods }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error searching foods:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ foods: [], error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
