// server/utils/nutrition.ts

export interface NutritionTotals {
  total_calories: number
  total_protein: number
  total_fat: number
  total_carbs: number
}

export function calculateDishNutrition(
  ingredients: Array<{
    quantity_grams: number
    product: {
      calories_per_100g: number
      protein_per_100g: number
      fat_per_100g: number
      carbs_per_100g: number
    }
  }>
): NutritionTotals {
  const totals = ingredients.reduce(
    (acc, ing) => {
      const factor = ing.quantity_grams / 100
      acc.total_calories += ing.product.calories_per_100g * factor
      acc.total_protein  += ing.product.protein_per_100g  * factor
      acc.total_fat      += ing.product.fat_per_100g      * factor
      acc.total_carbs    += ing.product.carbs_per_100g    * factor
      return acc
    },
    { total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0 }
  )

  return {
    total_calories: round1(totals.total_calories),
    total_protein:  round1(totals.total_protein),
    total_fat:      round1(totals.total_fat),
    total_carbs:    round1(totals.total_carbs),
  }
}

export function round1(n: number) {
  return Math.round(n * 10) / 10
}
