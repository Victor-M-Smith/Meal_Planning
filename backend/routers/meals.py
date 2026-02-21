from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/meals", tags=["meals"])


def _get_or_create_ingredient(db: Session, ing_data: schemas.MealIngredientBase) -> models.Ingredient:
    if ing_data.ingredient_id:
        ing = db.query(models.Ingredient).get(ing_data.ingredient_id)
        if not ing:
            raise HTTPException(404, f"Ingredient {ing_data.ingredient_id} not found")
        return ing
    if ing_data.ingredient_name:
        name = ing_data.ingredient_name.strip().lower()
        ing = db.query(models.Ingredient).filter(models.Ingredient.name == name).first()
        if not ing:
            ing = models.Ingredient(name=name, default_unit=ing_data.unit)
            db.add(ing)
            db.flush()
        return ing
    raise HTTPException(400, "Must provide ingredient_id or ingredient_name")


@router.get("", response_model=list[schemas.MealSummary])
def list_meals(db: Session = Depends(get_db)):
    return db.query(models.Meal).order_by(models.Meal.name).all()


@router.get("/{meal_id}", response_model=schemas.MealOut)
def get_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(models.Meal).get(meal_id)
    if not meal:
        raise HTTPException(404, "Meal not found")
    return meal


@router.post("", response_model=schemas.MealOut, status_code=201)
def create_meal(payload: schemas.MealCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Meal).filter(models.Meal.name == payload.name).first()
    if existing:
        raise HTTPException(409, "A meal with this name already exists")

    meal = models.Meal(
        name=payload.name,
        protein_type=payload.protein_type,
        general_class=payload.general_class,
        serves=payload.serves,
        complexity=payload.complexity,
        rating=payload.rating,
        recipe=payload.recipe,
        comments=payload.comments,
    )
    db.add(meal)
    db.flush()

    for ing_data in payload.ingredients:
        ingredient = _get_or_create_ingredient(db, ing_data)
        mi = models.MealIngredient(
            meal_id=meal.id,
            ingredient_id=ingredient.id,
            quantity=ing_data.quantity,
            unit=ing_data.unit,
        )
        db.add(mi)

    db.commit()
    db.refresh(meal)
    return meal


@router.put("/{meal_id}", response_model=schemas.MealOut)
def update_meal(meal_id: int, payload: schemas.MealUpdate, db: Session = Depends(get_db)):
    meal = db.query(models.Meal).get(meal_id)
    if not meal:
        raise HTTPException(404, "Meal not found")

    # Check name uniqueness (excluding self)
    dup = db.query(models.Meal).filter(models.Meal.name == payload.name, models.Meal.id != meal_id).first()
    if dup:
        raise HTTPException(409, "Another meal already has this name")

    meal.name = payload.name
    meal.protein_type = payload.protein_type
    meal.general_class = payload.general_class
    meal.serves = payload.serves
    meal.complexity = payload.complexity
    meal.rating = payload.rating
    meal.recipe = payload.recipe
    meal.comments = payload.comments

    # Replace ingredients
    db.query(models.MealIngredient).filter(models.MealIngredient.meal_id == meal_id).delete()
    for ing_data in payload.ingredients:
        ingredient = _get_or_create_ingredient(db, ing_data)
        mi = models.MealIngredient(
            meal_id=meal.id,
            ingredient_id=ingredient.id,
            quantity=ing_data.quantity,
            unit=ing_data.unit,
        )
        db.add(mi)

    db.commit()
    db.refresh(meal)
    return meal


@router.delete("/{meal_id}", status_code=204)
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(models.Meal).get(meal_id)
    if not meal:
        raise HTTPException(404, "Meal not found")
    db.delete(meal)
    db.commit()


# ── Ingredients autocomplete ──────────────────────────────────────────────────

@router.get("/ingredients/all", response_model=list[schemas.IngredientOut])
def list_ingredients(db: Session = Depends(get_db)):
    return db.query(models.Ingredient).order_by(models.Ingredient.name).all()
