"""
seed.py — run once to populate example meals.
  cd backend && venv/bin/python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def get_or_create_ingredient(name, unit):
    ing = db.query(models.Ingredient).filter(models.Ingredient.name == name).first()
    if not ing:
        ing = models.Ingredient(name=name, default_unit=unit)
        db.add(ing)
        db.flush()
    return ing

MEALS = [
    {
        "name": "Spaghetti Bolognese",
        "protein_type": "Beef",
        "general_class": "Pasta",
        "serves": 4,
        "complexity": 4,
        "rating": 9,
        "recipe": "Brown mince. Fry onion, garlic. Add tomatoes, herbs. Simmer 30 min. Serve with spaghetti and parmesan.",
        "ingredients": [
            ("beef mince", 500, "g"),
            ("spaghetti", 400, "g"),
            ("onion", 1, "item"),
            ("garlic cloves", 3, "item"),
            ("canned tomatoes", 400, "g"),
            ("parmesan", 50, "g"),
        ],
    },
    {
        "name": "Chicken Tikka Masala",
        "protein_type": "Chicken",
        "general_class": "Curry",
        "serves": 4,
        "complexity": 6,
        "rating": 9,
        "recipe": "Marinate chicken in yoghurt and spices. Grill. Make tomato-cream sauce with spices. Combine and simmer.",
        "ingredients": [
            ("chicken breast", 700, "g"),
            ("plain yoghurt", 150, "g"),
            ("canned tomatoes", 400, "g"),
            ("double cream", 150, "ml"),
            ("onion", 1, "item"),
            ("garlic cloves", 4, "item"),
            ("garam masala", 2, "tsp"),
            ("cumin", 1, "tsp"),
        ],
    },
    {
        "name": "Lentil Dahl",
        "protein_type": "Vegetarian",
        "general_class": "Curry",
        "serves": 4,
        "complexity": 3,
        "rating": 8,
        "recipe": "Fry onion, ginger, garlic with spices. Add lentils and stock. Simmer 25 min. Finish with lemon and coriander.",
        "ingredients": [
            ("red lentils", 300, "g"),
            ("onion", 1, "item"),
            ("garlic cloves", 3, "item"),
            ("fresh ginger", 20, "g"),
            ("coconut milk", 200, "ml"),
            ("vegetable stock", 400, "ml"),
            ("cumin", 1, "tsp"),
            ("turmeric", 1, "tsp"),
        ],
    },
    {
        "name": "Salmon with Roasted Veg",
        "protein_type": "Fish",
        "general_class": "Roast",
        "serves": 2,
        "complexity": 3,
        "rating": 8,
        "recipe": "Roast veg at 200°C for 25 min. Season salmon. Pan-fry 4 min each side. Serve with veg.",
        "ingredients": [
            ("salmon fillets", 2, "item"),
            ("courgette", 1, "item"),
            ("bell pepper", 1, "item"),
            ("cherry tomatoes", 200, "g"),
            ("olive oil", 3, "tbsp"),
            ("lemon", 1, "item"),
        ],
    },
    {
        "name": "Lamb Shepherd's Pie",
        "protein_type": "Lamb",
        "general_class": "Stew",
        "serves": 4,
        "complexity": 5,
        "rating": 8,
        "recipe": "Brown lamb mince with veg and stock. Top with mashed potato. Bake at 190°C for 25 min.",
        "ingredients": [
            ("lamb mince", 500, "g"),
            ("onion", 1, "item"),
            ("carrot", 2, "item"),
            ("peas", 100, "g"),
            ("potato", 800, "g"),
            ("butter", 50, "g"),
            ("milk", 100, "ml"),
            ("beef stock", 300, "ml"),
        ],
    },
    {
        "name": "Chicken Caesar Salad",
        "protein_type": "Chicken",
        "general_class": "Salad",
        "serves": 2,
        "complexity": 2,
        "rating": 7,
        "recipe": "Grill or pan-fry chicken. Toss romaine with caesar dressing. Top with chicken, croutons, and parmesan.",
        "ingredients": [
            ("chicken breast", 300, "g"),
            ("romaine lettuce", 1, "item"),
            ("caesar dressing", 3, "tbsp"),
            ("parmesan", 30, "g"),
            ("croutons", 50, "g"),
        ],
    },
    {
        "name": "Beef Stir-fry",
        "protein_type": "Beef",
        "general_class": "Stir-fry",
        "serves": 2,
        "complexity": 4,
        "rating": 8,
        "recipe": "Slice beef thin. Stir-fry at high heat with veg and sauce. Serve over rice or noodles.",
        "ingredients": [
            ("beef sirloin", 300, "g"),
            ("broccoli", 200, "g"),
            ("bell pepper", 1, "item"),
            ("soy sauce", 3, "tbsp"),
            ("sesame oil", 1, "tbsp"),
            ("garlic cloves", 2, "item"),
            ("fresh ginger", 10, "g"),
            ("jasmine rice", 200, "g"),
        ],
    },
    {
        "name": "Margherita Pizza",
        "protein_type": "Vegetarian",
        "general_class": "Pizza",
        "serves": 2,
        "complexity": 6,
        "rating": 8,
        "recipe": "Make or buy dough. Spread tomato sauce. Top with mozzarella. Bake at 250°C for 10–12 min.",
        "ingredients": [
            ("pizza dough", 400, "g"),
            ("tomato passata", 150, "ml"),
            ("mozzarella", 200, "g"),
            ("fresh basil", 10, "g"),
            ("olive oil", 1, "tbsp"),
        ],
    },
]

for m in MEALS:
    existing = db.query(models.Meal).filter(models.Meal.name == m["name"]).first()
    if existing:
        print(f"  skip (exists): {m['name']}")
        continue
    meal = models.Meal(
        name=m["name"],
        protein_type=m["protein_type"],
        general_class=m["general_class"],
        serves=m["serves"],
        complexity=m["complexity"],
        rating=m["rating"],
        recipe=m.get("recipe", ""),
    )
    db.add(meal)
    db.flush()
    for (ing_name, qty, unit) in m.get("ingredients", []):
        ing = get_or_create_ingredient(ing_name, unit)
        db.add(models.MealIngredient(meal_id=meal.id, ingredient_id=ing.id, quantity=qty, unit=unit))
    print(f"  added: {m['name']}")

db.commit()
print("\n✅ Seed complete!")
