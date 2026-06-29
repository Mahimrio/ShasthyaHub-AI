import type { SupabaseClient } from '@supabase/supabase-js';
import type { EnrichedFoodItem } from '@/types';

export interface FoodItem {
  name: string;
  caloriesPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionData {
  calories_per_100g: number;
  carbs_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
}

export interface GeminiFoodItem {
  name_en: string;
  name_bn: string;
  estimated_grams: number;
  confidence: number;
}

export const foodDatabase: FoodItem[] = [
  { name: 'White Rice (cooked)', caloriesPer100g: 130, protein: 2.4, carbs: 28.7, fat: 0.3 },
  { name: 'Brown Rice (cooked)', caloriesPer100g: 112, protein: 2.6, carbs: 24.0, fat: 0.9 },
  { name: 'Paratha', caloriesPer100g: 326, protein: 6.5, carbs: 45.0, fat: 14.0 },
  { name: 'Roti/Chapati', caloriesPer100g: 264, protein: 8.1, carbs: 55.0, fat: 3.0 },
  { name: 'Puri', caloriesPer100g: 340, protein: 5.5, carbs: 45.0, fat: 16.0 },
  { name: 'Naan', caloriesPer100g: 310, protein: 8.5, carbs: 55.0, fat: 7.0 },
  { name: 'Red Lentil Dal', caloriesPer100g: 116, protein: 9.0, carbs: 20.1, fat: 0.4 },
  { name: 'Mixed Dal', caloriesPer100g: 120, protein: 8.5, carbs: 21.0, fat: 0.6 },
  { name: 'Cholar Dal', caloriesPer100g: 140, protein: 9.5, carbs: 24.0, fat: 0.8 },
  { name: 'Hilsa Fish Curry', caloriesPer100g: 220, protein: 19.0, carbs: 2.0, fat: 16.0 },
  { name: 'Rohu Fish Curry', caloriesPer100g: 180, protein: 18.0, carbs: 1.5, fat: 12.0 },
  { name: 'Catfish Curry', caloriesPer100g: 175, protein: 17.0, carbs: 1.0, fat: 12.0 },
  { name: 'Chicken Curry', caloriesPer100g: 185, protein: 18.0, carbs: 2.0, fat: 12.0 },
  { name: 'Beef Curry', caloriesPer100g: 195, protein: 20.0, carbs: 1.5, fat: 12.5 },
  { name: 'Mutton Curry', caloriesPer100g: 210, protein: 18.0, carbs: 1.0, fat: 15.0 },
  { name: 'Egg Bhuna', caloriesPer100g: 155, protein: 12.0, carbs: 2.0, fat: 11.0 },
  { name: 'Scrambled Egg', caloriesPer100g: 148, protein: 11.0, carbs: 1.5, fat: 11.0 },
  { name: 'Potato Bhorta', caloriesPer100g: 95, protein: 2.0, carbs: 17.0, fat: 2.5 },
  { name: 'Eggplant Bhorta', caloriesPer100g: 68, protein: 1.5, carbs: 6.0, fat: 4.5 },
  { name: 'Spinach (Palak)', caloriesPer100g: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: 'Bitter Gourd', caloriesPer100g: 20, protein: 1.0, carbs: 4.3, fat: 0.2 },
  { name: 'Bottle Gourd', caloriesPer100g: 15, protein: 0.6, carbs: 3.4, fat: 0.0 },
  { name: 'Cauliflower', caloriesPer100g: 25, protein: 1.9, carbs: 5.0, fat: 0.3 },
  { name: 'Cabbage', caloriesPer100g: 25, protein: 1.3, carbs: 5.8, fat: 0.1 },
  { name: 'Tomato', caloriesPer100g: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Onion', caloriesPer100g: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { name: 'Yogurt/Doi', caloriesPer100g: 59, protein: 3.5, carbs: 7.0, fat: 1.5 },
  { name: 'Mishti Doi', caloriesPer100g: 140, protein: 3.0, carbs: 25.0, fat: 3.0 },
  { name: 'Milk', caloriesPer100g: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: 'Banana', caloriesPer100g: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: 'Mango', caloriesPer100g: 60, protein: 0.8, carbs: 15.0, fat: 0.4 },
  { name: 'Jackfruit', caloriesPer100g: 94, protein: 1.5, carbs: 24.0, fat: 0.6 },
  { name: 'Guava', caloriesPer100g: 68, protein: 2.6, carbs: 14.3, fat: 0.6 },
  { name: 'Papaya', caloriesPer100g: 43, protein: 0.5, carbs: 10.8, fat: 0.3 },
  { name: 'Watermelon', caloriesPer100g: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
  { name: 'Pineapple', caloriesPer100g: 50, protein: 0.5, carbs: 13.1, fat: 0.1 },
  { name: 'Lychee', caloriesPer100g: 66, protein: 0.8, carbs: 16.5, fat: 0.4 },
  { name: 'Khichuri', caloriesPer100g: 165, protein: 6.0, carbs: 28.0, fat: 3.5 },
  { name: 'Biryani Chicken', caloriesPer100g: 290, protein: 12.0, carbs: 35.0, fat: 12.0 },
  { name: 'Biryani Beef', caloriesPer100g: 310, protein: 14.0, carbs: 33.0, fat: 14.0 },
  { name: 'Polao', caloriesPer100g: 185, protein: 4.0, carbs: 33.0, fat: 4.5 },
  { name: 'Kheer', caloriesPer100g: 130, protein: 5.0, carbs: 20.0, fat: 4.0 },
  { name: 'Payesh', caloriesPer100g: 120, protein: 3.0, carbs: 22.0, fat: 2.5 },
  { name: 'Singara', caloriesPer100g: 195, protein: 5.0, carbs: 25.0, fat: 9.0 },
  { name: 'Piyaju', caloriesPer100g: 185, protein: 4.0, carbs: 22.0, fat: 10.0 },
  { name: 'Jilapi', caloriesPer100g: 280, protein: 3.0, carbs: 60.0, fat: 4.0 },
  { name: 'Halua', caloriesPer100g: 350, protein: 5.0, carbs: 55.0, fat: 12.0 },
  { name: 'Shemai', caloriesPer100g: 165, protein: 4.0, carbs: 32.0, fat: 2.5 },
  { name: 'Biscuit', caloriesPer100g: 450, protein: 7.0, carbs: 70.0, fat: 16.0 },
  { name: 'Bread White', caloriesPer100g: 265, protein: 8.0, carbs: 49.0, fat: 3.5 },
  { name: 'Bread Brown', caloriesPer100g: 247, protein: 9.0, carbs: 44.0, fat: 3.0 },
  { name: 'Coconut Water', caloriesPer100g: 19, protein: 0.7, carbs: 3.7, fat: 0.2 },
  { name: 'Tea no sugar', caloriesPer100g: 2, protein: 0.1, carbs: 0.3, fat: 0.0 },
  { name: 'Tea with milk+sugar', caloriesPer100g: 45, protein: 1.0, carbs: 7.0, fat: 1.5 },
  { name: 'Lassi sweet', caloriesPer100g: 100, protein: 2.5, carbs: 16.0, fat: 3.0 },
  { name: 'Sugarcane Juice', caloriesPer100g: 73, protein: 0.0, carbs: 17.5, fat: 0.0 },
  { name: 'Muri (Puffed Rice)', caloriesPer100g: 350, protein: 7.0, carbs: 78.0, fat: 1.5 },
  { name: 'Chanachur', caloriesPer100g: 420, protein: 12.0, carbs: 55.0, fat: 18.0 },
  { name: 'Badam (Peanut)', caloriesPer100g: 567, protein: 25.8, carbs: 16.1, fat: 49.2 },
  { name: 'Coconut fresh', caloriesPer100g: 354, protein: 3.3, carbs: 15.2, fat: 33.5 },
  { name: 'Dates', caloriesPer100g: 282, protein: 2.5, carbs: 75.0, fat: 0.4 },
  { name: 'Honey', caloriesPer100g: 304, protein: 0.3, carbs: 82.1, fat: 0.0 },
  { name: 'Sugar', caloriesPer100g: 387, protein: 0.0, carbs: 100.0, fat: 0.0 },
  { name: 'Jaggery (Gur)', caloriesPer100g: 383, protein: 0.4, carbs: 98.0, fat: 0.0 },
  { name: 'Lentil Soup', caloriesPer100g: 80, protein: 6.0, carbs: 14.0, fat: 0.5 },
  { name: 'Cucumber', caloriesPer100g: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: 'Carrot', caloriesPer100g: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
];

export function calculateCalories(
  items: { food: FoodItem; grams: number }[]
): { totalCalories: number; protein: number; carbs: number; fat: number } {
  return items.reduce(
    (acc, { food, grams }) => {
      const factor = grams / 100;
      return {
        totalCalories: acc.totalCalories + food.caloriesPer100g * factor,
        protein: acc.protein + food.protein * factor,
        carbs: acc.carbs + food.carbs * factor,
        fat: acc.fat + food.fat * factor,
      };
    },
    { totalCalories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// --- GlycoVision service layer ---

/**
 * Normalize a food name for database lookup: lowercase, trim, and optionally
 * strip common cooking-method qualifiers that interfere with matching.
 */
function normalizeFoodName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Generate lookup variants for a food name to improve USDA hit rate.
 * e.g. "Chicken Curry" → ["chicken curry", "chicken", "curried chicken"]
 */
function usdaQueryVariants(name: string): string[] {
  const n = name.trim().toLowerCase();
  const variants: string[] = [n];

  // Strip parenthetical descriptions
  const stripped = n.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (stripped && stripped !== n) variants.push(stripped);

  // Strip common cooking method suffixes
  const cookingWords = ['curry', 'fried', 'cooked', 'roasted', 'grilled', 'stir-fried', 'sautéed', 'bhuna', 'bhorta'];
  for (const word of cookingWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    const without = stripped.replace(regex, '').replace(/\s{2,}/g, ' ').trim();
    if (without && !variants.includes(without)) variants.push(without);
  }

  // For curries, also try "curried X"
  if (/\bcurry\b/i.test(n)) {
    const base = n.replace(/\s*curry\s*/i, '').trim();
    if (base) variants.push(`curried ${base}`);
  }

  // For "X with Y" patterns, try just the first ingredient
  const withMatch = n.match(/^(.+?)\s+with\s+/i);
  if (withMatch) variants.push(withMatch[1].trim());

  return [...new Set(variants)]; // deduplicate
}

/**
 * Extract nutrient values from USDA foods array with robust key matching.
 * USDA nutrient names vary: "Energy", "Energy (kcal)", "Energy (Atwater Specific Factors)",
 * "Carbohydrate, by difference", "Protein", "Total lipid (fat)", etc.
 */
function extractUsdaNutrition(
  foods: { foodNutrients?: { nutrientName?: string; value?: number }[] }[]
): NutritionData | null {
  for (const food of foods) {
    const nutrients = food.foodNutrients ?? [];
    if (nutrients.length === 0) continue;

    const matchNutrient = (patterns: string[]): number => {
      for (const n of nutrients) {
        const name = (n.nutrientName ?? '').toLowerCase();
        if (patterns.some((p) => name.includes(p))) {
          return n.value ?? 0;
        }
      }
      return 0;
    };

    const data: NutritionData = {
      calories_per_100g: matchNutrient(['energy']),
      carbs_per_100g: matchNutrient(['carbohydrate', 'by difference']),
      protein_per_100g: matchNutrient(['protein']),
      fat_per_100g: matchNutrient(['total lipid', 'fat']),
    };

    // Reject results where every value is 0 — likely a failed parse
    if (data.calories_per_100g > 0 || data.carbs_per_100g > 0) {
      return data;
    }
  }
  return null;
}

/**
 * Look up nutrition data for a food item.
 *
 * 1. Try the Supabase `bd_food_items` table (name_en / name_bn ILIKE match).
 * 2. If not found, fall back to the USDA FoodData Central API with multiple
 *    query strategies (exact → stripped → base ingredient).
 * 3. If USDA returns a result, cache it in `bd_food_items` for future lookups.
 * 4. Return `null` for genuinely unknown foods — the caller can ask an LLM.
 */
export async function lookupNutrition(
  foodName: string,
  supabase: SupabaseClient
): Promise<NutritionData | null> {
  const normalized = normalizeFoodName(foodName);

  // Step 1 — Supabase lookup (try exact first, then ILIKE)
  const { data: exact } = await supabase
    .from('bd_food_items')
    .select('calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g')
    .ilike('name_en', normalized)
    .limit(1)
    .maybeSingle();

  if (exact) {
    return {
      calories_per_100g: Number(exact.calories_per_100g),
      carbs_per_100g: exact.carbs_per_100g != null ? Number(exact.carbs_per_100g) : 0,
      protein_per_100g: exact.protein_per_100g != null ? Number(exact.protein_per_100g) : 0,
      fat_per_100g: exact.fat_per_100g != null ? Number(exact.fat_per_100g) : 0,
    };
  }

  const { data: fuzzy } = await supabase
    .from('bd_food_items')
    .select('calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g')
    .or(`name_en.ilike.%${normalized}%,name_bn.ilike.%${normalized}%`)
    .limit(1)
    .maybeSingle();

  if (fuzzy) {
    return {
      calories_per_100g: Number(fuzzy.calories_per_100g),
      carbs_per_100g: fuzzy.carbs_per_100g != null ? Number(fuzzy.carbs_per_100g) : 0,
      protein_per_100g: fuzzy.protein_per_100g != null ? Number(fuzzy.protein_per_100g) : 0,
      fat_per_100g: fuzzy.fat_per_100g != null ? Number(fuzzy.fat_per_100g) : 0,
    };
  }

  // Step 2 — USDA FoodData Central API
  const usdaKey = process.env.USDA_API_KEY;
  if (!usdaKey) return null;

  const variants = usdaQueryVariants(foodName);

  for (const query of variants) {
    try {
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${usdaKey}&pageSize=3&dataType=Foundation,SR Legacy,Branded`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;

      const body: { foods?: { foodNutrients?: { nutrientName?: string; value?: number }[] }[] } = await res.json();
      if (!body.foods || body.foods.length === 0) continue;

      const nutrition = extractUsdaNutrition(body.foods);
      if (!nutrition) continue;

      // Step 3 — Cache in Supabase (non-blocking, best-effort)
      try {
        await supabase.from('bd_food_items').insert({
          name_en: foodName,
          name_bn: null,
          calories_per_100g: nutrition.calories_per_100g,
          carbs_per_100g: nutrition.carbs_per_100g,
          protein_per_100g: nutrition.protein_per_100g,
          fat_per_100g: nutrition.fat_per_100g,
        });
      } catch {
        // Cache miss is non-fatal
      }

      return nutrition;
    } catch {
      continue; // try next variant
    }
  }

  return null;
}

/**
 * Enrich a list of food items identified by Gemini with per-item nutritional
 * values. Each item's calories / macros are scaled from per-100g by the
 * estimated portion weight.
 *
 * Lookup chain: Supabase `bd_food_items` → Groq batch (all unknowns in 1 call).
 * USDA API is intentionally skipped — it adds latency and rarely matches
 * Bangladeshi cuisine; the static DB + Groq batch is faster and more reliable.
 */
export async function calculateTotalNutrition(
  foodItems: GeminiFoodItem[],
  supabase: SupabaseClient
): Promise<EnrichedFoodItem[]> {
  const { callGroq } = await import('@/lib/ai/groq');

  // Phase 1 — look up every item in Supabase (fast, no external API)
  const lookupResults = await Promise.all(
    foodItems.map(async (item) => ({
      item,
      nutrition: await lookupNutrition(item.name_en, supabase),
    }))
  );

  // Phase 2 — batch-ask Groq for any items Supabase couldn't resolve
  const unknownItems = lookupResults.filter((r) => !r.nutrition).map((r) => r.item);

  const batchNutrition: Map<string, { calories_per_100g: number; carbs_per_100g: number; protein_per_100g: number; fat_per_100g: number }> = new Map();

  if (unknownItems.length > 0) {
    const itemNames = unknownItems.map((i) => i.name_en).join('", "');
    const prompt = `You are a clinical dietitian specializing in South Asian cuisine. Estimate the nutritional values per 100g for each of these Bangladeshi food items: "${itemNames}". Consider typical Bangladeshi cooking methods (oil, ghee, coconut milk, frying). Return ONLY valid JSON — an array of objects, each with these exact keys: name_en (string), calories_per_100g (integer), carbs_per_100g (number), protein_per_100g (number), fat_per_100g (number).`;
    try {
      const raw = await callGroq(`Estimate per-100g nutrition for Bangladeshi items: ${itemNames}`, prompt);
      const arr = Array.isArray(raw) ? raw : ((raw ?? {}) as Record<string, unknown>)['items'] ?? [];
      if (Array.isArray(arr)) {
        for (const entry of arr) {
          const o = (entry ?? {}) as Record<string, unknown>;
          const name = typeof o['name_en'] === 'string' ? o['name_en'] : '';
          if (name) {
            batchNutrition.set(name, {
              calories_per_100g: typeof o['calories_per_100g'] === 'number' ? o['calories_per_100g'] : 0,
              carbs_per_100g: typeof o['carbs_per_100g'] === 'number' ? o['carbs_per_100g'] : 0,
              protein_per_100g: typeof o['protein_per_100g'] === 'number' ? o['protein_per_100g'] : 0,
              fat_per_100g: typeof o['fat_per_100g'] === 'number' ? o['fat_per_100g'] : 0,
            });
          }
        }
      }
    } catch {
      // batch Groq failed — all unknown items get zero defaults
    }
  }

  // Phase 3 — assemble results
  return lookupResults.map(({ item, nutrition }) => {
    const n = nutrition ?? batchNutrition.get(item.name_en) ?? { calories_per_100g: 0, carbs_per_100g: 0, protein_per_100g: 0, fat_per_100g: 0 };
    const factor = item.estimated_grams / 100;
    return {
      name_en: item.name_en,
      name_bn: item.name_bn,
      estimated_grams: item.estimated_grams,
      calories: Math.round(n.calories_per_100g * factor),
      confidence: item.confidence,
      carbs_g: Math.round(n.carbs_per_100g * factor * 10) / 10,
      protein_g: Math.round(n.protein_per_100g * factor * 10) / 10,
      fat_g: Math.round(n.fat_per_100g * factor * 10) / 10,
    };
  });
}