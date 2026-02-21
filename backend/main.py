from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from database import Base, engine
from routers import meals, weekly_plan, shopping_list

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Meal Planner API", version="1.0.0")

# ── API Routers ───────────────────────────────────────────────────────────────
app.include_router(meals.router)
app.include_router(weekly_plan.router)
app.include_router(shopping_list.router)


# ── Serve React build (production) ────────────────────────────────────────────
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        index = FRONTEND_DIST / "index.html"
        return FileResponse(index)
