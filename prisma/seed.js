// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function calcNutrition(ingredients, products) {
  let cal = 0, prot = 0, fat = 0, carbs = 0
  for (const ing of ingredients) {
    const p = products.find(p => p.name === ing.product)
    if (!p) { console.warn(`  ⚠️  Продукт не найден: "${ing.product}"`) ; continue }
    const factor = ing.grams / 100
    cal   += p.calories_per_100g * factor
    prot  += p.protein_per_100g  * factor
    fat   += p.fat_per_100g      * factor
    carbs += p.carbs_per_100g    * factor
  }
  return {
    total_calories: Math.round(cal   * 10) / 10,
    total_protein:  Math.round(prot  * 10) / 10,
    total_fat:      Math.round(fat   * 10) / 10,
    total_carbs:    Math.round(carbs * 10) / 10,
  }
}

async function main() {
  console.log('🌱 Заполняем базу данных...')

  // ── Продукты ──────────────────────────────────────────────────────────────
  const productData = [
    // Злаки / Крупы
    { name: 'Овсяные хлопья',        calories_per_100g: 389, protein_per_100g: 17,  fat_per_100g: 7,   carbs_per_100g: 66,  category: 'grain' },
    { name: 'Рис белый',              calories_per_100g: 365, protein_per_100g: 7,   fat_per_100g: 0.7, carbs_per_100g: 80,  category: 'grain' },
    { name: 'Хлеб цельнозерновой',   calories_per_100g: 247, protein_per_100g: 13,  fat_per_100g: 3.4, carbs_per_100g: 41,  category: 'grain' },
    { name: 'Паста (сухая)',          calories_per_100g: 371, protein_per_100g: 13,  fat_per_100g: 1.5, carbs_per_100g: 75,  category: 'grain' },
    { name: 'Мука пшеничная',        calories_per_100g: 364, protein_per_100g: 10,  fat_per_100g: 1,   carbs_per_100g: 76,  category: 'grain' },
    { name: 'Мука рисовая',          calories_per_100g: 366, protein_per_100g: 6,   fat_per_100g: 1.4, carbs_per_100g: 80,  category: 'grain' },
    { name: 'Крахмал кукурузный',    calories_per_100g: 381, protein_per_100g: 0.3, fat_per_100g: 0.1, carbs_per_100g: 91,  category: 'grain' },
    { name: 'Разрыхлитель',          calories_per_100g: 53,  protein_per_100g: 0,   fat_per_100g: 0,   carbs_per_100g: 28,  category: 'other' },
    { name: 'Батон',                  calories_per_100g: 266, protein_per_100g: 8,   fat_per_100g: 3.2, carbs_per_100g: 51,  category: 'grain' },

    // Мясо
    { name: 'Говяжья грудинка',      calories_per_100g: 218, protein_per_100g: 17,  fat_per_100g: 16,  carbs_per_100g: 0,   category: 'meat' },
    { name: 'Говяжий фарш',          calories_per_100g: 215, protein_per_100g: 26,  fat_per_100g: 12,  carbs_per_100g: 0,   category: 'meat' },
    { name: 'Куриная грудка',        calories_per_100g: 165, protein_per_100g: 31,  fat_per_100g: 3.6, carbs_per_100g: 0,   category: 'meat' },
    { name: 'Куриные ножки',         calories_per_100g: 197, protein_per_100g: 16,  fat_per_100g: 15,  carbs_per_100g: 0,   category: 'meat' },
    { name: 'Куриное филе бедра',    calories_per_100g: 185, protein_per_100g: 17,  fat_per_100g: 13,  carbs_per_100g: 0,   category: 'meat' },
    { name: 'Куриное малое филе',    calories_per_100g: 113, protein_per_100g: 23,  fat_per_100g: 2,   carbs_per_100g: 0,   category: 'meat' },
    { name: 'Свиной окорок',         calories_per_100g: 261, protein_per_100g: 15,  fat_per_100g: 22,  carbs_per_100g: 0,   category: 'meat' },
    { name: 'Свиная корейка',        calories_per_100g: 172, protein_per_100g: 19,  fat_per_100g: 10,  carbs_per_100g: 0,   category: 'meat' },
    { name: 'Фарш свиной',           calories_per_100g: 263, protein_per_100g: 16,  fat_per_100g: 22,  carbs_per_100g: 0,   category: 'meat' },
    { name: 'Ветчина',               calories_per_100g: 120, protein_per_100g: 17,  fat_per_100g: 5,   carbs_per_100g: 1.5, category: 'meat' },
    { name: 'Лосось',                calories_per_100g: 208, protein_per_100g: 20,  fat_per_100g: 13,  carbs_per_100g: 0,   category: 'meat' },

    // Молочное
    { name: 'Яйца',                  calories_per_100g: 155, protein_per_100g: 13,  fat_per_100g: 11,  carbs_per_100g: 1.1, category: 'dairy' },
    { name: 'Желтки яичные',         calories_per_100g: 322, protein_per_100g: 16,  fat_per_100g: 27,  carbs_per_100g: 3.6, category: 'dairy' },
    { name: 'Белки яичные',          calories_per_100g: 52,  protein_per_100g: 11,  fat_per_100g: 0.2, carbs_per_100g: 0.7, category: 'dairy' },
    { name: 'Творог 5%',             calories_per_100g: 121, protein_per_100g: 17,  fat_per_100g: 5,   carbs_per_100g: 3,   category: 'dairy' },
    { name: 'Сливки 20%',            calories_per_100g: 206, protein_per_100g: 2.8, fat_per_100g: 20,  carbs_per_100g: 3.7, category: 'dairy' },
    { name: 'Сметана 10%',           calories_per_100g: 116, protein_per_100g: 3,   fat_per_100g: 10,  carbs_per_100g: 2.9, category: 'dairy' },
    { name: 'Молоко 2.5%',          calories_per_100g: 52,  protein_per_100g: 2.9, fat_per_100g: 2.5, carbs_per_100g: 4.7, category: 'dairy' },
    { name: 'Кокосовое молоко',      calories_per_100g: 197, protein_per_100g: 2.3, fat_per_100g: 21,  carbs_per_100g: 2.8, category: 'dairy' },
    { name: 'Сливочное масло',       calories_per_100g: 717, protein_per_100g: 0.9, fat_per_100g: 81,  carbs_per_100g: 0.1, category: 'oil' },
    { name: 'Сыр лёгкий 15%',       calories_per_100g: 190, protein_per_100g: 20,  fat_per_100g: 12,  carbs_per_100g: 0,   category: 'dairy' },
    { name: 'Сыр твёрдый',          calories_per_100g: 403, protein_per_100g: 25,  fat_per_100g: 33,  carbs_per_100g: 1.3, category: 'dairy' },
    { name: 'Творожный сыр',         calories_per_100g: 253, protein_per_100g: 7,   fat_per_100g: 23,  carbs_per_100g: 4,   category: 'dairy' },
    { name: 'Пармезан',              calories_per_100g: 431, protein_per_100g: 38,  fat_per_100g: 29,  carbs_per_100g: 4,   category: 'dairy' },
    { name: 'Моцарелла',             calories_per_100g: 280, protein_per_100g: 22,  fat_per_100g: 20,  carbs_per_100g: 2.2, category: 'dairy' },

    // Овощи
    { name: 'Лук репчатый',          calories_per_100g: 40,  protein_per_100g: 1.1, fat_per_100g: 0.1, carbs_per_100g: 9.3, category: 'vegetable' },
    { name: 'Чеснок',                calories_per_100g: 149, protein_per_100g: 6.4, fat_per_100g: 0.5, carbs_per_100g: 33,  category: 'vegetable' },
    { name: 'Помидоры',              calories_per_100g: 18,  protein_per_100g: 0.9, fat_per_100g: 0.2, carbs_per_100g: 3.9, category: 'vegetable' },
    { name: 'Вяленые томаты',        calories_per_100g: 258, protein_per_100g: 14,  fat_per_100g: 3,   carbs_per_100g: 44,  category: 'vegetable' },
    { name: 'Томатный соус',         calories_per_100g: 29,  protein_per_100g: 1.7, fat_per_100g: 0.2, carbs_per_100g: 6,   category: 'vegetable' },
    { name: 'Морковь',               calories_per_100g: 41,  protein_per_100g: 0.9, fat_per_100g: 0.2, carbs_per_100g: 10,  category: 'vegetable' },
    { name: 'Картофель',             calories_per_100g: 77,  protein_per_100g: 2,   fat_per_100g: 0.1, carbs_per_100g: 17,  category: 'vegetable' },
    { name: 'Тыква',                 calories_per_100g: 26,  protein_per_100g: 1,   fat_per_100g: 0.1, carbs_per_100g: 6.5, category: 'vegetable' },
    { name: 'Кабачок',               calories_per_100g: 17,  protein_per_100g: 1.2, fat_per_100g: 0.3, carbs_per_100g: 3.1, category: 'vegetable' },
    { name: 'Свёкла',                calories_per_100g: 43,  protein_per_100g: 1.6, fat_per_100g: 0.2, carbs_per_100g: 10,  category: 'vegetable' },
    { name: 'Шампиньоны',            calories_per_100g: 22,  protein_per_100g: 3.1, fat_per_100g: 0.3, carbs_per_100g: 3.3, category: 'vegetable' },
    { name: 'Салатные листья',       calories_per_100g: 15,  protein_per_100g: 1.3, fat_per_100g: 0.2, carbs_per_100g: 2.9, category: 'vegetable' },
    { name: 'Корнишоны',             calories_per_100g: 11,  protein_per_100g: 0.7, fat_per_100g: 0.1, carbs_per_100g: 2.5, category: 'vegetable' },
    { name: 'Брокколи',              calories_per_100g: 34,  protein_per_100g: 2.8, fat_per_100g: 0.4, carbs_per_100g: 7,   category: 'vegetable' },
    { name: 'Болгарский перец',      calories_per_100g: 31,  protein_per_100g: 1,   fat_per_100g: 0.3, carbs_per_100g: 6,   category: 'vegetable' },
    { name: 'Шпинат',                calories_per_100g: 23,  protein_per_100g: 2.9, fat_per_100g: 0.4, carbs_per_100g: 3.6, category: 'vegetable' },

    // Фрукты
    { name: 'Лимон',                 calories_per_100g: 29,  protein_per_100g: 1.1, fat_per_100g: 0.3, carbs_per_100g: 9,   category: 'fruit' },
    { name: 'Банан',                 calories_per_100g: 89,  protein_per_100g: 1.1, fat_per_100g: 0.3, carbs_per_100g: 23,  category: 'fruit' },

    // Масла
    { name: 'Оливковое масло',       calories_per_100g: 884, protein_per_100g: 0,   fat_per_100g: 100, carbs_per_100g: 0,   category: 'oil' },
    { name: 'Растительное масло',    calories_per_100g: 899, protein_per_100g: 0,   fat_per_100g: 100, carbs_per_100g: 0,   category: 'oil' },

    // Прочее
    { name: 'Мёд',                   calories_per_100g: 304, protein_per_100g: 0.3, fat_per_100g: 0,   carbs_per_100g: 82,  category: 'other' },
    { name: 'Горчица зернистая',     calories_per_100g: 143, protein_per_100g: 9.9, fat_per_100g: 9.9, carbs_per_100g: 5.8, category: 'other' },
    { name: 'Горчица',               calories_per_100g: 143, protein_per_100g: 9.9, fat_per_100g: 9.9, carbs_per_100g: 5.8, category: 'other' },
    { name: 'Оливки без косточек',   calories_per_100g: 145, protein_per_100g: 1,   fat_per_100g: 15,  carbs_per_100g: 3.8, category: 'other' },
    { name: 'Каперсы',               calories_per_100g: 23,  protein_per_100g: 2.4, fat_per_100g: 0.9, carbs_per_100g: 5,   category: 'other' },
    { name: 'Имбирь',                calories_per_100g: 80,  protein_per_100g: 1.8, fat_per_100g: 0.8, carbs_per_100g: 18,  category: 'other' },
    { name: 'Яблочный уксус',        calories_per_100g: 21,  protein_per_100g: 0,   fat_per_100g: 0,   carbs_per_100g: 0.9, category: 'other' },
    { name: 'Арахис',                calories_per_100g: 567, protein_per_100g: 26,  fat_per_100g: 49,  carbs_per_100g: 16,  category: 'other' },
    { name: 'Куриный бульон',        calories_per_100g: 15,  protein_per_100g: 1.5, fat_per_100g: 0.5, carbs_per_100g: 1.4, category: 'other' },
    { name: 'Паприка сладкая',       calories_per_100g: 282, protein_per_100g: 14,  fat_per_100g: 13,  carbs_per_100g: 54,  category: 'other' },
    { name: 'Базилик сушёный',       calories_per_100g: 233, protein_per_100g: 23,  fat_per_100g: 4,   carbs_per_100g: 48,  category: 'other' },
    { name: 'Орегано',               calories_per_100g: 265, protein_per_100g: 9,   fat_per_100g: 4.3, carbs_per_100g: 69,  category: 'other' },
    { name: 'Специи (микс)',         calories_per_100g: 200, protein_per_100g: 8,   fat_per_100g: 5,   carbs_per_100g: 40,  category: 'other' },
  ]

  for (const p of productData) {
    await prisma.product.upsert({ where: { name: p.name }, update: p, create: p })
  }
  console.log(`✅ ${productData.length} продуктов добавлено`)

  // ── Блюда ────────────────────────────────────────────────────────────────
  const dishRecipes = [

    // ── МЯСО ────────────────────────────────────────────────────────────────
    {
      dish: {
        name: 'Рваная говядина', servings: 6,
        category: 'dinner',
        cooking_time: 240,
        notes: 'Говядина запекается при 150°С под фольгой 3–4 часа до состояния, когда мясо легко разбирается вилками.',
      },
      ingredients: [
        { product: 'Говяжья грудинка', grams: 1000 },
        { product: 'Чеснок',           grams: 20   },
        { product: 'Лук репчатый',     grams: 120  },
        { product: 'Оливковое масло',  grams: 20   },
        { product: 'Специи (микс)',    grams: 10   },
        { product: 'Куриный бульон',   grams: 250  },
      ],
    },

    {
      dish: {
        name: 'Лимонные куриные ножки', servings: 6,
        category: 'dinner',
        cooking_time: 55,
        notes: 'Маринад: оливковое масло, лимон, мёд, имбирь, чеснок. Мариновать 1 час. Запекать 180°С — 35 мин, затем 200°С — 10–15 мин.',
      },
      ingredients: [
        { product: 'Куриные ножки',     grams: 1000 },
        { product: 'Оливковое масло',   grams: 30   },
        { product: 'Лимон',             grams: 30   },  // сок ~20г + цедра
        { product: 'Оливки без косточек', grams: 100 },
        { product: 'Каперсы',           grams: 20   },
        { product: 'Мёд',               grams: 10   },
        { product: 'Имбирь',            grams: 10   },
        { product: 'Чеснок',            grams: 5    },
      ],
    },

    {
      dish: {
        name: 'Куриные колбаски', servings: 8,
        category: 'dinner',
        cooking_time: 30,
        notes: 'Формуются в пищевой плёнке, замораживаются. Варить 15 мин или запекать при 200°С 20–25 мин.',
      },
      ingredients: [
        { product: 'Куриное малое филе',  grams: 300 },
        { product: 'Куриное филе бедра',  grams: 300 },
        { product: 'Лук репчатый',        grams: 80  },
        { product: 'Яйца',               grams: 50  },
        { product: 'Сливочное масло',     grams: 30  },
        { product: 'Крахмал кукурузный', grams: 20  },
        { product: 'Сливки 20%',         grams: 50  },
        { product: 'Специи (микс)',       grams: 5   },
      ],
    },

    {
      dish: {
        name: 'Буженина в специях', servings: 8,
        category: 'dinner',
        cooking_time: 45,
        notes: 'Натереть горчицей, маслом и специями. Мариновать 2–3 часа. Запекать в пакете при 160°С 30 мин, затем открыть и при 190°С ещё 7–10 мин.',
      },
      ingredients: [
        { product: 'Свиной окорок',      grams: 1500 },
        { product: 'Горчица зернистая',  grams: 20   },
        { product: 'Оливковое масло',    grams: 20   },
        { product: 'Паприка сладкая',    grams: 10   },
        { product: 'Чеснок',             grams: 5    },
        { product: 'Специи (микс)',      grams: 10   },
      ],
    },

    {
      dish: {
        name: 'Фрикадельки', servings: 6,
        category: 'dinner',
        cooking_time: 40,
        notes: 'Лук натереть на тёрке или пробить в блендере. Дать фаршу отстояться 1 час. Можно запечь или потушить в соусе.',
      },
      ingredients: [
        { product: 'Говяжий фарш',   grams: 400 },
        { product: 'Лук репчатый',   grams: 60  },
        { product: 'Яйца',           grams: 50  },
        { product: 'Специи (микс)',  grams: 5   },
      ],
    },

    {
      dish: {
        name: 'Мясо по-французски', servings: 6,
        category: 'dinner',
        cooking_time: 50,
        notes: 'Мясо отбить. Лук с чесноком и грибами обжарить. Выложить слоями. Запекать 180°С ~30 мин. Можно заморозить, разогревать с сыром.',
      },
      ingredients: [
        { product: 'Свиная корейка',  grams: 900 },
        { product: 'Лук репчатый',    grams: 150 },
        { product: 'Чеснок',          grams: 10  },
        { product: 'Помидоры',        grams: 200 },
        { product: 'Шампиньоны',      grams: 200 },
        { product: 'Сыр твёрдый',     grams: 100 },
        { product: 'Растительное масло', grams: 15 },
        { product: 'Орегано',         grams: 2   },
      ],
    },

    {
      dish: {
        name: 'Мясные гнёзда с грибами', servings: 8,
        category: 'dinner',
        cooking_time: 50,
        notes: 'В говяжий фарш добавить лук, яйцо, батон. Сформировать шарики с углублением. Начинка: грибы+лук+творожный сыр. Запекать 180°С.',
      },
      ingredients: [
        { product: 'Говяжий фарш',    grams: 800 },
        { product: 'Лук репчатый',    grams: 200 },
        { product: 'Яйца',            grams: 50  },
        { product: 'Батон',           grams: 100 },
        { product: 'Шампиньоны',      grams: 400 },
        { product: 'Творожный сыр',   grams: 60  },
        { product: 'Паприка сладкая', grams: 5   },
        { product: 'Сыр твёрдый',     grams: 50  },
      ],
    },

    // ── СУПЫ ────────────────────────────────────────────────────────────────
    {
      dish: {
        name: 'Пряный тыквенный суп-пюре', servings: 4,
        category: 'lunch',
        cooking_time: 55,
        notes: 'Овощи запечь при 180°С 30 мин. Пробить блендером с бульоном. Добавить кокосовое молоко. Подавать с беконом.',
      },
      ingredients: [
        { product: 'Тыква',            grams: 500 },
        { product: 'Картофель',        grams: 200 },
        { product: 'Морковь',          grams: 80  },
        { product: 'Лук репчатый',     grams: 100 },
        { product: 'Куриный бульон',   grams: 250 },
        { product: 'Кокосовое молоко', grams: 150 },
        { product: 'Имбирь',           grams: 5   },
        { product: 'Растительное масло', grams: 15 },
        { product: 'Специи (микс)',    grams: 4   },
      ],
    },

    // ── ЗАВТРАКИ / ВЫПЕЧКА ──────────────────────────────────────────────────
    {
      dish: {
        name: 'Кабачковые вафли', servings: 4,
        category: 'breakfast',
        cooking_time: 20,
        notes: 'Кабачки натереть и хорошо отжать от влаги. Смешать с мукой, яйцом и солью. Выпекать в вафельнице с маслом.',
      },
      ingredients: [
        { product: 'Кабачок',          grams: 300 },
        { product: 'Мука пшеничная',   grams: 60  },
        { product: 'Яйца',             grams: 55  },
        { product: 'Растительное масло', grams: 10 },
      ],
    },

    {
      dish: {
        name: 'Творожные бейглы', servings: 6,
        category: 'breakfast',
        cooking_time: 45,
        notes: 'Смешать всё до однородности (зернистый творог пробить блендером). Сформировать бейглы с отверстием. Запекать 180°С 40 мин.',
      },
      ingredients: [
        { product: 'Творог 5%',       grams: 180 },
        { product: 'Яйца',            grams: 55  },
        { product: 'Мука рисовая',    grams: 50  },
        { product: 'Сыр твёрдый',     grams: 30  },
      ],
    },

    {
      dish: {
        name: 'Творожные мини-пиццы', servings: 8,
        category: 'breakfast',
        cooking_time: 45,
        notes: 'Тесто как у бейглов, но формуются лепёшки с углублением. Начинка: томатный соус, ветчина, корнишоны, каперсы, моцарелла. Запекать 180°С 40 мин.',
      },
      ingredients: [
        { product: 'Творог 5%',        grams: 360 },
        { product: 'Яйца',             grams: 55  },
        { product: 'Мука рисовая',     grams: 200 },
        { product: 'Разрыхлитель',     grams: 5   },
        { product: 'Томатный соус',    grams: 60  },
        { product: 'Ветчина',          grams: 80  },
        { product: 'Корнишоны',        grams: 40  },
        { product: 'Каперсы',          grams: 15  },
        { product: 'Моцарелла',        grams: 80  },
      ],
    },

    {
      dish: {
        name: 'Картофельные вафли', servings: 15,
        category: 'breakfast',
        cooking_time: 40,
        notes: 'На 15 шт. Картофель натереть/пропустить через пресс. Вяленые томаты измельчить. Смешать всё. Выпекать в вафельнице ~7 мин на средней мощности.',
      },
      ingredients: [
        { product: 'Картофель',        grams: 1000 },
        { product: 'Белки яичные',     grams: 100  },
        { product: 'Яйца',             grams: 165  },
        { product: 'Сметана 10%',      grams: 150  },
        { product: 'Молоко 2.5%',     grams: 250  },
        { product: 'Мука пшеничная',   grams: 300  },
        { product: 'Разрыхлитель',     grams: 10   },
        { product: 'Вяленые томаты',   grams: 150  },
        { product: 'Сыр лёгкий 15%',  grams: 100  },
        { product: 'Базилик сушёный',  grams: 2    },
      ],
    },

    {
      dish: {
        name: 'Сырники', servings: 10,
        category: 'breakfast',
        cooking_time: 20,
        notes: 'Холодный творог смешать со всеми ингредиентами. Сформировать стаканом или ножом. Жарить на среднем огне 2–3 мин с каждой стороны.',
      },
      ingredients: [
        { product: 'Творог 5%',         grams: 400 },
        { product: 'Желтки яичные',     grams: 40  },
        { product: 'Мука пшеничная',    grams: 30  },
        { product: 'Крахмал кукурузный', grams: 10 },
        { product: 'Сыр лёгкий 15%',   grams: 50  },
        { product: 'Растительное масло', grams: 10 },
        { product: 'Сливочное масло',   grams: 10  },
      ],
    },

    // ── САЛАТЫ ──────────────────────────────────────────────────────────────
    {
      dish: {
        name: 'Салат из печёной тыквы с курицей', servings: 2,
        category: 'lunch',
        cooking_time: 60,
        notes: 'Тыква и курица маринуются по отдельности с чесноком, маслом, уксусом/лимоном. Запекать при 190°С: тыква 20 мин, курица 40 мин. Заправка: горчица+лимон+мёд+масло.',
      },
      ingredients: [
        { product: 'Тыква',            grams: 200 },
        { product: 'Куриная грудка',   grams: 150 },
        { product: 'Чеснок',           grams: 25  },
        { product: 'Оливковое масло',  grams: 50  },
        { product: 'Яблочный уксус',   grams: 10  },
        { product: 'Горчица',          grams: 15  },
        { product: 'Лимон',            grams: 20  },
        { product: 'Мёд',              grams: 10  },
        { product: 'Салатные листья',  grams: 60  },
        { product: 'Арахис',           grams: 30  },
        { product: 'Пармезан',         grams: 20  },
      ],
    },

    // ── ЗАГОТОВКИ ────────────────────────────────────────────────────────────
    {
      dish: {
        name: 'Маринованная свёкла', servings: 4,
        category: 'snack',
        cooking_time: 50,
        notes: 'Нарезать кусочками, сбрызнуть маслом, запекать при 200°С 45 мин. Отличная заготовка для салатов.',
      },
      ingredients: [
        { product: 'Свёкла',           grams: 500 },
        { product: 'Оливковое масло',  grams: 15  },
      ],
    },
  ]

  for (const { dish, ingredients } of dishRecipes) {
    const nutrition = calcNutrition(ingredients, productData)
    const productRecords = await prisma.product.findMany({
      where: { name: { in: ingredients.map(i => i.product) } }
    })

    const existing = await prisma.dish.findUnique({ where: { name: dish.name } })
    if (existing) {
      await prisma.dishIngredient.deleteMany({ where: { dish_id: existing.id } })
      await prisma.dish.update({
        where: { id: existing.id },
        data: {
          ...dish, ...nutrition,
          ingredients: {
            create: ingredients.map(ing => ({
              product_id:    productRecords.find(p => p.name === ing.product)?.id,
              quantity_grams: ing.grams,
            }))
          }
        }
      })
    } else {
      await prisma.dish.create({
        data: {
          ...dish, ...nutrition,
          ingredients: {
            create: ingredients.map(ing => ({
              product_id:    productRecords.find(p => p.name === ing.product)?.id,
              quantity_grams: ing.grams,
            }))
          }
        }
      })
    }
  }
  console.log(`✅ ${dishRecipes.length} блюд добавлено`)

  // ── Очищаем план питания ───────────────────────────────────────────────────
  await prisma.mealPlanEntry.deleteMany({})
  console.log('🗑️  План питания очищен')

  console.log('\n🎉 База данных заполнена!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

// ── Тестовый пользователь ─────────────────────────────────────────────────────
async function createTestUser() {
  const bcrypt = require('bcrypt')
  const hash = await bcrypt.hash('Test123!', 12)
  await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: { login: 'admin', password: hash, display_name: 'Администратор' },
  })
  console.log('✅ Тестовый пользователь: login=admin, password=Test123!')
}
createTestUser().catch(console.error).finally(() => {})
