from sqlalchemy import Column, Integer, String, Text, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    default_unit = Column(String, nullable=False, default="g")

    meal_ingredients = relationship("MealIngredient", back_populates="ingredient", cascade="all, delete")


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    protein_type = Column(String, nullable=False)   # Vegetarian, Chicken, Beef, Lamb, Fish, Other
    general_class = Column(String, nullable=False)  # Pasta, Curry, Salad, Burger, Soup, etc.
    serves = Column(Integer, nullable=False, default=4)
    complexity = Column(Integer, nullable=False, default=5)  # 1–10
    rating = Column(Integer, nullable=False, default=7)      # 1–10
    recipe = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    ingredients = relationship("MealIngredient", back_populates="meal", cascade="all, delete")
    weekly_plan_meals = relationship("WeeklyPlanMeal", back_populates="meal")


class MealIngredient(Base):
    __tablename__ = "meal_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)

    meal = relationship("Meal", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="meal_ingredients")


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    meals = relationship("WeeklyPlanMeal", back_populates="weekly_plan", cascade="all, delete")


class WeeklyPlanMeal(Base):
    __tablename__ = "weekly_plan_meals"

    id = Column(Integer, primary_key=True, index=True)
    weekly_plan_id = Column(Integer, ForeignKey("weekly_plans.id"), nullable=False)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    date = Column(Date, nullable=False)
    servings = Column(Integer, nullable=False, default=4)

    weekly_plan = relationship("WeeklyPlan", back_populates="meals")
    meal = relationship("Meal", back_populates="weekly_plan_meals")
