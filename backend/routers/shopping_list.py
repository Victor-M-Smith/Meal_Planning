from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/shopping-list", tags=["shopping-list"])


@router.get("/{plan_id}", response_model=schemas.ShoppingListOut)
def get_shopping_list(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.WeeklyPlan).get(plan_id)
    if not plan:
        raise HTTPException(404, "Weekly plan not found")

    # Aggregate: {(ingredient_id, unit): total_quantity}
    totals: dict[tuple, float] = defaultdict(float)
    ingredient_names: dict[int, str] = {}

    for plan_meal in plan.meals:
        meal = plan_meal.meal
        scale = plan_meal.servings / meal.serves if meal.serves else 1.0

        for mi in meal.ingredients:
            key = (mi.ingredient_id, mi.unit)
            totals[key] += mi.quantity * scale
            ingredient_names[mi.ingredient_id] = mi.ingredient.name

    items = [
        schemas.ShoppingItem(
            ingredient_id=ing_id,
            ingredient_name=ingredient_names[ing_id],
            total_quantity=round(qty, 2),
            unit=unit,
        )
        for (ing_id, unit), qty in sorted(totals.items(), key=lambda x: ingredient_names[x[0][0]])
    ]

    return schemas.ShoppingListOut(weekly_plan_id=plan_id, items=items)
