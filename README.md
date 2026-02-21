# 🥘 Meal Planner

A personal weekly meal planner with shopping list generation. Built with FastAPI + React + SQLite.

## Features (MVP)

- **Meal library** — create, edit, delete meals with ingredients, complexity, rating, protein type
- **Weekly plan generation** — auto-generate a 6-meal week (Wed–Mon, Tuesday is leftovers), avoiding last week's meals
- **Edit plans** — swap any day's meal, adjust servings per day
- **Shopping list** — auto-aggregated from the week's meals, scaled to servings, with checkboxes and copy-to-clipboard

---

## Quick Start (Development)

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone / unzip the project

```bash
cd meal-planner
```

### Create venv:

```
cd backend

:: Create the virtualenv (if you haven't already)
python -m venv venv

:: Install dependencies
venv/Scripts/pip install -r requirements.txt

:: Now seed works
venv/Scripts/python seed.py
```

### 2. Start everything

```bash
chmod +x start.sh
./start.sh
```

This will:
- Create a Python virtualenv and install dependencies
- Install npm packages
- Start FastAPI on `http://localhost:8000`
- Start Vite dev server on `http://localhost:5173`

**Open `http://localhost:5173` in your browser.**

### 3. (Optional) Seed example meals

```bash
cd backend
venv/Scripts/python seed.py
```

This adds 8 example meals so you can generate a plan immediately.

---

## Project Structure

```
meal-planner/
├── backend/
│   ├── main.py          # FastAPI app + static file serving
│   ├── database.py      # SQLAlchemy + SQLite setup
│   ├── models.py        # ORM models
│   ├── schemas.py       # Pydantic schemas
│   ├── seed.py          # Example meal data
│   ├── requirements.txt
│   └── routers/
│       ├── meals.py         # CRUD for meals + ingredients
│       ├── weekly_plan.py   # Plan generation + editing
│       └── shopping_list.py # Aggregated shopping list
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js           # Centralized fetch client
│   │   ├── pages/
│   │   │   ├── Meals.jsx        # Meal list with search/filter
│   │   │   ├── MealForm.jsx     # Create/edit form
│   │   │   ├── WeeklyPlan.jsx   # Plan view with swap/servings
│   │   │   └── ShoppingList.jsx # Checklist with overrides
│   │   └── components/
│   │       └── Nav.jsx
│   ├── package.json
│   ├── vite.config.js       # Proxies /api → localhost:8000
│   └── tailwind.config.js
├── start.sh    # Dev startup
├── build.sh    # Production build
└── README.md
```

---

## Production Build (Single Process)

```bash
chmod +x build.sh
./build.sh

# Then run:
cd backend
venv/Scripts/uvicorn main:app --reload --port 8000
```

FastAPI will serve the built React app at `http://localhost:8000`.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meals` | List all meals |
| POST | `/api/meals` | Create meal |
| GET | `/api/meals/{id}` | Get meal detail |
| PUT | `/api/meals/{id}` | Update meal |
| DELETE | `/api/meals/{id}` | Delete meal |
| GET | `/api/meals/ingredients/all` | Ingredient autocomplete |
| GET | `/api/weekly-plans` | List all plans |
| POST | `/api/weekly-plans/generate` | Generate new plan |
| GET | `/api/weekly-plans/{id}` | Get plan |
| DELETE | `/api/weekly-plans/{id}` | Delete plan |
| PUT | `/api/weekly-plans/{id}/meals/{pid}/replace` | Swap a day's meal |
| PATCH | `/api/weekly-plans/{id}/meals/{pid}/servings` | Update servings |
| GET | `/api/shopping-list/{plan_id}` | Get shopping list |

Interactive API docs available at `http://localhost:8000/docs`.

---

## Data Model

```
Meal ──< MealIngredient >── Ingredient
  │
  └──< WeeklyPlanMeal >── WeeklyPlan
```

---

## Phase 2 Ideas

- Constraint engine (min vegetarian count, max complexity, protein rotation)
- Default weekly rule profiles
- Meal tags (quick, freezer-friendly, kid-friendly)
- User authentication / multi-family
- Mobile PWA
- Export shopping list to PDF / share
