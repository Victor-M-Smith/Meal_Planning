from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


# ── Ingredient ──────────────────────────────────────────────────────────────

class IngredientBase(BaseModel):
    name: str
    default_unit: str = "g"

class IngredientCreate(IngredientBase):
    pass

class IngredientOut(IngredientBase):
    id: int
    model_config = {"from_attributes": True}


# ── MealIngredient ───────────────────────────────────────────────────────────

class MealIngredientBase(BaseModel):
    ingredient_id: Optional[int] = None
    ingredient_name: Optional[str] = None   # convenience: create ingredient on-the-fly
    quantity: float
    unit: str

class MealIngredientOut(BaseModel):
    id: int
    ingredient: IngredientOut
    quantity: float
    unit: str
    model_config = {"from_attributes": True}


# ── Meal ─────────────────────────────────────────────────────────────────────

PROTEIN_TYPES = ["Vegetarian", "Chicken", "Beef", "Lamb", "Fish", "Pork", "Other"]
GENERAL_CLASSES = ["Pasta", "Curry", "Salad", "Burger", "Soup", "Stir-fry", "Roast", "Pizza", "Tacos", "Stew", "Other"]

class MealBase(BaseModel):
    name: str
    protein_type: str
    general_class: str
    serves: int = 4
    complexity: int = Field(default=5, ge=1, le=10)
    rating: int = Field(default=7, ge=1, le=10)
    recipe: Optional[str] = None
    comments: Optional[str] = None

class MealCreate(MealBase):
    ingredients: list[MealIngredientBase] = []

class MealUpdate(MealBase):
    ingredients: list[MealIngredientBase] = []

class MealOut(MealBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    ingredients: list[MealIngredientOut] = []
    model_config = {"from_attributes": True}

class MealSummary(MealBase):
    id: int
    model_config = {"from_attributes": True}


# ── Weekly Plan ───────────────────────────────────────────────────────────────

class WeeklyPlanMealOut(BaseModel):
    id: int
    date: date
    servings: int
    meal: MealSummary
    model_config = {"from_attributes": True}

class WeeklyPlanOut(BaseModel):
    id: int
    start_date: date
    end_date: date
    created_at: Optional[datetime] = None
    meals: list[WeeklyPlanMealOut] = []
    model_config = {"from_attributes": True}

class DayConstraint(BaseModel):
    protein_type: Optional[str] = None   # None means "any"
    general_class: Optional[str] = None  # None means "any"

class GeneratePlanRequest(BaseModel):
    start_date: date   # Should be a Wednesday
    default_servings: int = 4
    day_constraints: Optional[list[DayConstraint]] = None  # 6 items (Wed–Mon); None = no constraints

class ReplaceMealRequest(BaseModel):
    meal_id: int
    servings: Optional[int] = None

class UpdateServingsRequest(BaseModel):
    servings: int


# ── Shopping List ─────────────────────────────────────────────────────────────

class ShoppingItem(BaseModel):
    ingredient_id: int
    ingredient_name: str
    total_quantity: float
    unit: str

class ShoppingListOut(BaseModel):
    weekly_plan_id: int
    items: list[ShoppingItem]
