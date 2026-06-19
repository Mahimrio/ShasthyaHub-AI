export interface FoodItem {
  name: string;
  caloriesPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
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