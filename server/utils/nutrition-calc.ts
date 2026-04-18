// server/utils/nutrition-calc.ts
// Расчёт дневной нормы нутриентов по формуле Миффлина-Сан Жеора

export interface NutritionGoals {
  calories: number
  protein:  number   // г
  fat:      number   // г
  carbs:    number   // г
}

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary:   1.2,   // сидячий образ жизни
  light:       1.375, // лёгкая активность 1-3 дня/нед
  moderate:    1.55,  // умеренная 3-5 дней/нед
  active:      1.725, // высокая 6-7 дней/нед
  very_active: 1.9,   // очень высокая + физ. работа
}

const GOAL_ADJUSTMENT: Record<string, number> = {
  lose:     -500,  // дефицит 500 ккал → ~0.5 кг/нед
  maintain:    0,
  gain:      300,  // профицит 300 ккал → мышечный набор
  recomp:   -200,  // небольшой дефицит при высоком белке
}

export function calcNutritionGoals(profile: {
  gender:     string
  birth_year?: number | null
  height_cm?: number | null
  weight_kg?: number | null
  activity:   string
  goal:       string
}): NutritionGoals | null {
  if (!profile.height_cm || !profile.weight_kg) return null

  const age    = profile.birth_year ? new Date().getFullYear() - profile.birth_year : 30
  const h      = profile.height_cm
  const w      = profile.weight_kg
  const isMale = profile.gender === 'male'

  // Формула Миффлина-Сан Жеора (базовый метаболизм)
  const bmr = isMale
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161

  const tdee = bmr * (ACTIVITY_FACTOR[profile.activity] ?? 1.55)
  const targetCal = Math.round(tdee + (GOAL_ADJUSTMENT[profile.goal] ?? 0))

  // Распределение макронутриентов
  let proteinG: number, fatG: number, carbsG: number

  if (profile.goal === 'recomp' || profile.goal === 'gain') {
    // Высокий белок: 2.2 г/кг
    proteinG = Math.round(w * 2.2)
    fatG     = Math.round(targetCal * 0.25 / 9)
    carbsG   = Math.round((targetCal - proteinG * 4 - fatG * 9) / 4)
  } else if (profile.goal === 'lose') {
    // Белок для сохранения мышц: 2.0 г/кг
    proteinG = Math.round(w * 2.0)
    fatG     = Math.round(targetCal * 0.30 / 9)
    carbsG   = Math.round((targetCal - proteinG * 4 - fatG * 9) / 4)
  } else {
    // Поддержание: стандарт
    proteinG = Math.round(w * 1.6)
    fatG     = Math.round(targetCal * 0.28 / 9)
    carbsG   = Math.round((targetCal - proteinG * 4 - fatG * 9) / 4)
  }

  return {
    calories: Math.max(1200, targetCal),
    protein:  Math.max(50, proteinG),
    fat:      Math.max(30, fatG),
    carbs:    Math.max(50, Math.max(0, carbsG)),
  }
}
