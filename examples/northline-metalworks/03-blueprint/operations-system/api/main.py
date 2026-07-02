"""FastAPI entrypoint. The API is the only writer to the database; every surface goes through it."""
from fastapi import FastAPI

from .routes import quotes
from .routes import inventory
from .routes import deliveries

app = FastAPI(title="Operations System")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(quotes.router)
app.include_router(inventory.router)
app.include_router(deliveries.router)
