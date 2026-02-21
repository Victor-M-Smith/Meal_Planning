from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
import random

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/weekly-plans", tags=["weekly-plans"])

# Days offsets from Wednesday (day 0)
PLAN_DAYS = [0, 1, 2, 3, 4, 5]  # Wed, Thu, Fri, Sat, Sun, Mon  (Tuesday = leftovers, skipped)


def _get_plan_or_404(plan_id: int, db: Session) -> models.WeeklyPlan:
    plan = db.query(models.WeeklyPlan).get(plan_id)
    if not plan:
        raise HTTPException(404, "Weekly plan not found")
    return plan


@router.get("", response_model=list[schemas.WeeklyPlanOut])
def list_plans(db: Session = Depends(get_db)):
    return db.query(models.WeeklyPlan).order_by(models.WeeklyPlan.start_date.desc()).all()


@router.get("/{plan_id}", response_model=schemas.WeeklyPlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    return _get_plan_or_404(plan_id, db)


DAY_LABELS = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday']


@router.post("/generate", response_model=schemas.WeeklyPlanOut, status_code=201)
def generate_plan(payload: schemas.GeneratePlanRequest, db: Session = Depends(get_db)):
    start = payload.start_date
    end = start + timedelta(days=5)  # Wed → Mon

    # Find last week's meal IDs to avoid repeating them
    last_plan = db.query(models.WeeklyPlan).order_by(models.WeeklyPlan.start_date.desc()).first()
    excluded_ids: set[int] = set()
    if last_plan:
        excluded_ids = {wpm.meal_id for wpm in last_plan.meals}

    all_meals = db.query(models.Meal).all()
    eligible_base = [m for m in all_meals if m.id not in excluded_ids]

    # Fall back to all meals if not enough after exclusion
    if len(eligible_base) < 6:
        eligible_base = list(all_meals)

    if len(all_meals) < 6:
        raise HTTPException(
            400,
            f"Not enough meals to generate a plan. You have {len(all_meals)} meal(s); need at least 6."
        )

    # Normalise constraints to always be a list of 6
    raw_constraints = payload.day_constraints or []
    constraints = []
    for i in range(6):
        c = raw_constraints[i] if i < len(raw_constraints) else schemas.DayConstraint()
        constraints.append(c)

    # Greedy per-day selection respecting constraints + no-duplicate rule
    chosen: list[models.Meal] = []
    used_ids: set[int] = set()

    for i, constraint in enumerate(constraints):
        day_pool = [
            m for m in eligible_base
            if m.id not in used_ids
            and (not constraint.protein_type or m.protein_type == constraint.protein_type)
            and (not constraint.general_class or m.general_class == constraint.general_class)
        ]
        if not day_pool:
            label = DAY_LABELS[i]
            filters = []
            if constraint.protein_type:
                filters.append(f"protein={constraint.protein_type}")
            if constraint.general_class:
                filters.append(f"class={constraint.general_class}")
            filter_desc = f" ({', '.join(filters)})" if filters else ""
            raise HTTPException(
                400,
                f"No eligible meal found for {label}{filter_desc}. "
                f"Add more meals or relax the constraint for that day."
            )
        meal = random.choice(day_pool)
        chosen.append(meal)
        used_ids.add(meal.id)

    plan = models.WeeklyPlan(start_date=start, end_date=end)
    db.add(plan)
    db.flush()

    for i, meal in enumerate(chosen):
        day_date = start + timedelta(days=PLAN_DAYS[i])
        wpm = models.WeeklyPlanMeal(
            weekly_plan_id=plan.id,
            meal_id=meal.id,
            date=day_date,
            servings=payload.default_servings,
        )
        db.add(wpm)

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=204)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = _get_plan_or_404(plan_id, db)
    db.delete(plan)
    db.commit()


@router.put("/{plan_id}/meals/{plan_meal_id}/replace", response_model=schemas.WeeklyPlanOut)
def replace_meal(
    plan_id: int,
    plan_meal_id: int,
    payload: schemas.ReplaceMealRequest,
    db: Session = Depends(get_db),
):
    plan = _get_plan_or_404(plan_id, db)
    plan_meal = db.query(models.WeeklyPlanMeal).get(plan_meal_id)
    if not plan_meal or plan_meal.weekly_plan_id != plan_id:
        raise HTTPException(404, "Plan meal not found")

    # Prevent duplicate meals within the week
    current_meal_ids = {wpm.meal_id for wpm in plan.meals if wpm.id != plan_meal_id}
    if payload.meal_id in current_meal_ids:
        raise HTTPException(409, "This meal is already in the weekly plan")

    new_meal = db.query(models.Meal).get(payload.meal_id)
    if not new_meal:
        raise HTTPException(404, "Meal not found")

    plan_meal.meal_id = payload.meal_id
    if payload.servings is not None:
        plan_meal.servings = payload.servings

    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/{plan_id}/meals/{plan_meal_id}/servings", response_model=schemas.WeeklyPlanOut)
def update_servings(
    plan_id: int,
    plan_meal_id: int,
    payload: schemas.UpdateServingsRequest,
    db: Session = Depends(get_db),
):
    plan = _get_plan_or_404(plan_id, db)
    plan_meal = db.query(models.WeeklyPlanMeal).get(plan_meal_id)
    if not plan_meal or plan_meal.weekly_plan_id != plan_id:
        raise HTTPException(404, "Plan meal not found")

    plan_meal.servings = payload.servings
    db.commit()
    db.refresh(plan)
    return plan
