/**
 * Meal theme rotation — 6 themes × 5 days = 30-day protocol month.
 * Each 30-day month moves through every theme exactly once.
 *
 * From the build brief (Specs/app-build-brief.md §4):
 *   themeIndex = floor(daysSinceCycleStart / 5) mod 6
 */

export interface MealTheme {
  name: string;
  description: string;
  meal1Hint: string;
  meal2Hint: string;
  snackHint: string;
  powerUpHint: string;
}

export const MEAL_THEMES: MealTheme[] = [
  {
    name: "Lean & Green",
    description: "Protein-forward, big vegetable volume",
    meal1Hint: "Eggs or protein shake + big veg",
    meal2Hint: "Grilled chicken/fish + large salad",
    snackHint: "Veggie sticks + protein",
    powerUpHint: "Green tea + handful of nuts",
  },
  {
    name: "Protein Bowl",
    description: "Grain + protein + sauce bowls",
    meal1Hint: "Greek yogurt (if tolerated) or eggs + grains",
    meal2Hint: "Quinoa/rice bowl + protein + sauce",
    snackHint: "Edamame or hard-boiled egg",
    powerUpHint: "Protein shake",
  },
  {
    name: "Grill Night",
    description: "Simple grilled proteins + roasted veg",
    meal1Hint: "Grilled eggs or protein + roasted veg",
    meal2Hint: "Grilled chicken/fish + roasted veg",
    snackHint: "Grilled veg + protein",
    powerUpHint: "Turkey or chicken",
  },
  {
    name: "Global Flavors",
    description: "Mediterranean/Asian-inspired swaps",
    meal1Hint: "Miso soup + eggs or tofu",
    meal2Hint: "Stir-fry or Mediterranean plate",
    snackHint: "Seaweed + protein",
    powerUpHint: "Jasmine tea + nuts",
  },
  {
    name: "Prep & Go",
    description: "Make-ahead, portioned meals",
    meal1Hint: "Prepped egg muffins or shake",
    meal2Hint: "Pre-portioned container meal",
    snackHint: "Pre-packed protein + veg",
    powerUpHint: "Pre-made protein shake",
  },
  {
    name: "Recovery Plate",
    description: "Higher-carb plate, larger portions",
    meal1Hint: "Eggs + sweet potato + veg",
    meal2Hint: "Chicken/fish + rice + extra veg",
    snackHint: "Fruit + protein",
    powerUpHint: "Oats + protein + berries",
  },
];

export function getMealTheme(
  daysSinceCycleStart: number,
): MealTheme {
  const themeIndex = Math.floor(daysSinceCycleStart / 5) % 6;
  return MEAL_THEMES[themeIndex];
}

export function getThemeIndex(daysSinceCycleStart: number): number {
  return Math.floor(daysSinceCycleStart / 5) % 6;
}
