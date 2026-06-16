export interface FoodItem {
  name: string;
  caloriesPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const foodDatabase: FoodItem[] = [];

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