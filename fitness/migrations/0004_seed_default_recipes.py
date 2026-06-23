from django.db import migrations


DEFAULT_RECIPES = [
    # ── LOSE WEIGHT ──────────────────────────────────────────────────────────
    {
        "goal": "lose", "meal_type": "breakfast", "name": "Greek Yogurt Parfait",
        "description": "High-protein, low-calorie breakfast to keep you full and energised.",
        "ingredients": "200g low-fat Greek yogurt\n1/2 cup mixed berries (fresh or frozen)\n2 tbsp granola\n1 tsp honey",
        "instructions": "1. Layer yogurt in a bowl or glass.\n2. Top with berries and granola.\n3. Drizzle honey on top. Serve immediately.",
        "calories": 280, "protein_g": 18, "carbs_g": 35, "fat_g": 5,
    },
    {
        "goal": "lose", "meal_type": "breakfast", "name": "Egg White Omelette",
        "description": "Lean protein-packed omelette with spinach and tomato.",
        "ingredients": "4 egg whites\nHandful of fresh spinach\n1/2 tomato, diced\nSalt, pepper, herbs to taste\n1 tsp olive oil",
        "instructions": "1. Whisk egg whites with salt and pepper.\n2. Heat oil in a non-stick pan over medium heat.\n3. Pour in egg whites; add spinach and tomato.\n4. Fold and cook until set. Serve hot.",
        "calories": 140, "protein_g": 24, "carbs_g": 4, "fat_g": 3,
    },
    {
        "goal": "lose", "meal_type": "lunch", "name": "Grilled Chicken Salad",
        "description": "Light and filling salad with lean grilled chicken and fresh vegetables.",
        "ingredients": "150g chicken breast\nMixed salad greens\n1/2 cucumber, sliced\n1/2 cup cherry tomatoes\n1 tbsp olive oil\n1 tbsp lemon juice\nSalt, pepper",
        "instructions": "1. Season and grill chicken breast for 6–7 min each side.\n2. Let rest, then slice.\n3. Toss salad greens, cucumber, and tomatoes.\n4. Drizzle with olive oil and lemon juice.\n5. Top with sliced chicken.",
        "calories": 310, "protein_g": 38, "carbs_g": 8, "fat_g": 12,
    },
    {
        "goal": "lose", "meal_type": "lunch", "name": "Tuna & Quinoa Bowl",
        "description": "Protein-rich bowl with complex carbs for sustained energy.",
        "ingredients": "1 can (120g) tuna in water, drained\n1/2 cup cooked quinoa\n1/4 avocado, sliced\n1/2 cup cherry tomatoes\n1 tbsp lemon juice\nFresh parsley",
        "instructions": "1. Cook quinoa according to package instructions.\n2. Place quinoa in a bowl.\n3. Top with tuna, avocado, and tomatoes.\n4. Squeeze lemon juice over and garnish with parsley.",
        "calories": 350, "protein_g": 32, "carbs_g": 28, "fat_g": 9,
    },
    {
        "goal": "lose", "meal_type": "dinner", "name": "Baked Salmon & Steamed Veggies",
        "description": "Omega-3 rich salmon with low-calorie steamed vegetables.",
        "ingredients": "180g salmon fillet\nBroccoli florets\nZucchini, sliced\n1 tbsp olive oil\nGarlic, lemon, dill",
        "instructions": "1. Preheat oven to 200°C.\n2. Place salmon on a baking sheet, drizzle with oil, season.\n3. Bake 15–18 minutes.\n4. Steam broccoli and zucchini for 5–6 min.\n5. Serve salmon with vegetables and lemon wedge.",
        "calories": 380, "protein_g": 40, "carbs_g": 12, "fat_g": 18,
    },
    {
        "goal": "lose", "meal_type": "dinner", "name": "Turkey Meatballs & Zucchini Noodles",
        "description": "Comfort food without the extra carbs — zucchini noodles keep it light.",
        "ingredients": "200g ground turkey\n2 medium zucchini (spiralised)\n1/2 cup tomato sauce\n1 egg\nGarlic, Italian herbs, salt, pepper",
        "instructions": "1. Mix turkey with egg, garlic, herbs, salt and pepper. Form small balls.\n2. Brown meatballs in a pan, finish in oven at 180°C for 12 min.\n3. Spiralise zucchini and sauté 2–3 min.\n4. Heat tomato sauce, add meatballs, serve over zoodles.",
        "calories": 340, "protein_g": 36, "carbs_g": 14, "fat_g": 12,
    },
    {
        "goal": "lose", "meal_type": "snack", "name": "Apple & Almond Butter",
        "description": "Simple, satisfying snack with natural sugars and healthy fats.",
        "ingredients": "1 medium apple, sliced\n1 tbsp almond butter",
        "instructions": "1. Slice apple into wedges.\n2. Serve with almond butter for dipping.",
        "calories": 170, "protein_g": 4, "carbs_g": 26, "fat_g": 7,
    },

    # ── MAINTAIN ─────────────────────────────────────────────────────────────
    {
        "goal": "maintain", "meal_type": "breakfast", "name": "Oatmeal with Fruits & Nuts",
        "description": "Balanced, fibre-rich breakfast to start the day right.",
        "ingredients": "80g rolled oats\n250ml milk or plant milk\n1 banana, sliced\nHandful of blueberries\n1 tbsp chopped walnuts\n1 tsp honey",
        "instructions": "1. Cook oats in milk over medium heat, stirring, for 5 min.\n2. Transfer to a bowl.\n3. Top with banana, blueberries, walnuts and honey.",
        "calories": 420, "protein_g": 14, "carbs_g": 68, "fat_g": 10,
    },
    {
        "goal": "maintain", "meal_type": "breakfast", "name": "Whole Grain Toast & Eggs",
        "description": "Classic balanced breakfast — complex carbs with quality protein.",
        "ingredients": "2 slices whole grain toast\n2 eggs\n1/2 avocado\nSalt, pepper, chilli flakes",
        "instructions": "1. Toast bread.\n2. Poach or fry eggs to your liking.\n3. Smash avocado onto toast, season.\n4. Top with eggs and chilli flakes.",
        "calories": 450, "protein_g": 22, "carbs_g": 38, "fat_g": 22,
    },
    {
        "goal": "maintain", "meal_type": "lunch", "name": "Chicken Rice Bowl",
        "description": "Well-rounded meal with lean protein and complex carbohydrates.",
        "ingredients": "150g chicken breast\n1 cup cooked brown rice\n1 cup roasted broccoli and peppers\n1 tbsp soy sauce\n1 tsp sesame oil\nGarlic, ginger",
        "instructions": "1. Season and cook chicken in a pan; slice.\n2. Toss broccoli and peppers in oil, roast at 200°C for 20 min.\n3. Serve rice topped with chicken and vegetables.\n4. Drizzle with soy sauce and sesame oil.",
        "calories": 490, "protein_g": 40, "carbs_g": 52, "fat_g": 9,
    },
    {
        "goal": "maintain", "meal_type": "lunch", "name": "Turkey & Veggie Wrap",
        "description": "Easy portable lunch with lean turkey and crunchy fresh veg.",
        "ingredients": "1 whole wheat tortilla\n100g sliced turkey breast\nRomaine lettuce\n1/2 tomato, sliced\n1/4 avocado\n1 tbsp Greek yogurt (as sauce)",
        "instructions": "1. Lay tortilla flat.\n2. Spread yogurt on tortilla.\n3. Layer turkey, lettuce, tomato and avocado.\n4. Roll tightly and slice in half.",
        "calories": 390, "protein_g": 30, "carbs_g": 35, "fat_g": 13,
    },
    {
        "goal": "maintain", "meal_type": "dinner", "name": "Pasta Primavera with Chicken",
        "description": "Satisfying dinner with pasta, colourful vegetables and lean chicken.",
        "ingredients": "100g whole wheat penne\n150g chicken breast\n1 cup mixed vegetables (courgette, peppers, cherry tomatoes)\n2 tbsp olive oil\nGarlic, basil, Parmesan",
        "instructions": "1. Cook pasta al dente.\n2. Sauté chicken in olive oil until cooked; remove.\n3. Add garlic and vegetables to pan, cook 5 min.\n4. Toss pasta with vegetables and chicken.\n5. Garnish with basil and Parmesan.",
        "calories": 520, "protein_g": 42, "carbs_g": 52, "fat_g": 14,
    },
    {
        "goal": "maintain", "meal_type": "dinner", "name": "Salmon Stir-Fry with Rice",
        "description": "Quick weeknight dinner with omega-3 rich salmon and Asian-inspired flavours.",
        "ingredients": "180g salmon fillet, cubed\n1 cup cooked jasmine rice\n1 cup stir-fry vegetables\n2 tbsp soy sauce\n1 tsp sesame oil\nGinger, garlic, spring onion",
        "instructions": "1. Heat sesame oil in a wok.\n2. Add ginger and garlic, sauté 30 seconds.\n3. Add salmon cubes, cook 3–4 min.\n4. Add vegetables and soy sauce; stir-fry 3 min.\n5. Serve over rice, garnish with spring onion.",
        "calories": 530, "protein_g": 38, "carbs_g": 48, "fat_g": 16,
    },

    # ── GAIN WEIGHT ──────────────────────────────────────────────────────────
    {
        "goal": "gain", "meal_type": "breakfast", "name": "PB Banana Smoothie Bowl",
        "description": "Calorie-dense, nutrient-rich smoothie bowl to fuel muscle growth.",
        "ingredients": "2 ripe bananas\n2 tbsp peanut butter\n200g Greek yogurt\n1 cup whole milk\n1/4 cup granola\n1 tbsp honey\nSliced banana and nuts to top",
        "instructions": "1. Blend bananas, peanut butter, yogurt and milk until smooth.\n2. Pour into a bowl — it should be thick.\n3. Top with granola, sliced banana, nuts and honey.",
        "calories": 680, "protein_g": 24, "carbs_g": 88, "fat_g": 22,
    },
    {
        "goal": "gain", "meal_type": "breakfast", "name": "Eggs, Bacon & Toast",
        "description": "Classic high-calorie breakfast to hit your surplus quickly.",
        "ingredients": "3 whole eggs\n3 strips back bacon\n2 slices sourdough toast\n1 tbsp butter\nSalt, pepper",
        "instructions": "1. Fry bacon until crispy.\n2. Scramble or fry eggs in butter.\n3. Toast bread, butter it.\n4. Plate everything together.",
        "calories": 720, "protein_g": 42, "carbs_g": 42, "fat_g": 38,
    },
    {
        "goal": "gain", "meal_type": "lunch", "name": "Beef & Rice Bowl",
        "description": "High-protein, calorie-dense lunch bowl to support muscle gain.",
        "ingredients": "200g lean beef mince\n1.5 cups cooked white rice\n1 cup mixed stir-fry veggies\n2 tbsp teriyaki sauce\n1 tsp sesame oil\nSpring onion",
        "instructions": "1. Brown mince in a pan, drain fat.\n2. Add teriyaki sauce and cook 2 min.\n3. Stir-fry vegetables separately in sesame oil.\n4. Serve rice topped with beef and veg.\n5. Garnish with spring onion.",
        "calories": 720, "protein_g": 50, "carbs_g": 72, "fat_g": 20,
    },
    {
        "goal": "gain", "meal_type": "lunch", "name": "Chicken Pasta Bake",
        "description": "Filling baked pasta with chicken and cheese for extra calories.",
        "ingredients": "150g penne pasta\n200g chicken breast, cubed\n1 cup tomato sauce\n50g mozzarella\n1 tbsp olive oil\nGarlic, Italian herbs",
        "instructions": "1. Cook pasta al dente.\n2. Brown chicken in olive oil with garlic.\n3. Mix pasta, chicken and tomato sauce in a baking dish.\n4. Top with mozzarella.\n5. Bake at 190°C for 20 min until golden.",
        "calories": 740, "protein_g": 55, "carbs_g": 75, "fat_g": 20,
    },
    {
        "goal": "gain", "meal_type": "dinner", "name": "Steak & Sweet Potato",
        "description": "Muscle-building dinner with quality protein and slow-release carbs.",
        "ingredients": "220g ribeye or sirloin steak\n2 medium sweet potatoes\n1 tbsp butter\nRosemary, garlic, salt, pepper",
        "instructions": "1. Bake sweet potatoes at 200°C for 45 min.\n2. Season steak generously.\n3. Sear in a hot pan 3–4 min each side for medium.\n4. Rest steak 5 min, then serve with sweet potato and butter.",
        "calories": 780, "protein_g": 52, "carbs_g": 60, "fat_g": 28,
    },
    {
        "goal": "gain", "meal_type": "dinner", "name": "Salmon, Rice & Avocado",
        "description": "Healthy calorie-dense dinner packed with omega-3s and good fats.",
        "ingredients": "200g salmon fillet\n1.5 cups cooked white rice\n1 avocado\n1 tbsp soy sauce\n1 tsp sesame oil\nLime, coriander",
        "instructions": "1. Season salmon; pan-fry skin-side down 4 min, flip 3 min.\n2. Cook rice.\n3. Slice avocado.\n4. Serve rice, salmon and avocado. Drizzle soy sauce and sesame oil.\n5. Garnish with lime and coriander.",
        "calories": 810, "protein_g": 48, "carbs_g": 65, "fat_g": 32,
    },
    {
        "goal": "gain", "meal_type": "pre_training", "name": "Oats & Banana Pre-Workout",
        "description": "Fast-digesting carbs to fuel your training session.",
        "ingredients": "80g rolled oats\n1 large banana\n200ml whole milk\n1 tbsp honey",
        "instructions": "1. Cook oats in milk.\n2. Slice banana over oats.\n3. Drizzle with honey and eat 60–90 min before training.",
        "calories": 480, "protein_g": 14, "carbs_g": 86, "fat_g": 8,
    },
    {
        "goal": "gain", "meal_type": "post_training", "name": "Chicken & Rice Recovery Bowl",
        "description": "Fast protein and carbs to kickstart muscle recovery after training.",
        "ingredients": "200g chicken breast, grilled\n1.5 cups cooked white rice\n1/2 cup steamed broccoli\n1 tbsp soy sauce",
        "instructions": "1. Grill chicken breast, slice.\n2. Cook white rice (fast-digesting carb source).\n3. Steam broccoli briefly.\n4. Plate together and drizzle soy sauce. Eat within 30–60 min post-workout.",
        "calories": 620, "protein_g": 52, "carbs_g": 68, "fat_g": 7,
    },
]


def seed_recipes(apps, schema_editor):
    Recipe = apps.get_model("fitness", "Recipe")
    for data in DEFAULT_RECIPES:
        Recipe.objects.create(is_default=True, user=None, **data)


def unseed_recipes(apps, schema_editor):
    Recipe = apps.get_model("fitness", "Recipe")
    Recipe.objects.filter(is_default=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("fitness", "0003_recipe"),
    ]

    operations = [
        migrations.RunPython(seed_recipes, reverse_code=unseed_recipes),
    ]
